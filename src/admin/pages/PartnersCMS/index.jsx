import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getAllDocuments, 
  createDocument, 
  deleteDocument 
} from '../../../firebase/firestore';
import { uploadFile } from '../../../firebase/storage';
import { Building, Plus, Trash2 } from 'lucide-react';
import Card, { CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import { useDashboardStore } from '../../../store/dashboardStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const partnerSchema = z.object({
  name: z.string().min(2, 'University name must be at least 2 characters'),
  image: z.any().optional(),
  imageUrl: z.string().url('Please enter a valid image URL').or(z.string().length(0)),
});

const PartnersCMS = () => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, id: null });

  const { showToast } = useUiStore();
  const { fetchStats } = useDashboardStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: '',
      imageUrl: ''
    }
  });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('partners');
      setPartners(data);
    } catch (err) {
      showToast('Error fetching partners.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleAddClick = () => {
    reset({
      name: '',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument('partners', confirmState.id);
      showToast('Partner deleted.', 'success');
      fetchPartners();
      fetchStats();
    } catch (err) {
      showToast('Delete failed.', 'error');
    } finally {
      setConfirmState({ open: false, id: null });
    }
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      let finalLogoUrl = formData.imageUrl;

      // Handle image file upload
      if (formData.image && formData.image.length > 0) {
        const file = formData.image[0];
        try {
          finalLogoUrl = await uploadFile(file, 'partners');
        } catch (uploadErr) {
          console.warn('Partner logo upload error, using local fallback:', uploadErr);
          // Standard base64 fallback
          finalLogoUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
          });
        }
      }

      if (!finalLogoUrl) {
        finalLogoUrl = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100';
      }

      await createDocument('partners', {
        name: formData.name,
        logo: finalLogoUrl
      });

      showToast('University partner added.', 'success');
      setIsModalOpen(false);
      fetchPartners();
      fetchStats();
    } catch (err) {
      showToast('Action failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Building className="w-6 h-6 text-secondary" /> Partners CMS
          </h1>
          <p className="text-xs text-text-secondary">Manage partner university associations and logos displayed on the site.</p>
        </div>
        <Button variant="secondary" size="md" icon={Plus} onClick={handleAddClick}>
          Upload University Logo
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : partners.length === 0 ? (
        <Card className="p-8 text-center italic text-text-secondary text-sm">
          No partner university associations configured yet. Click "Upload University Logo" to add one.
        </Card>
      ) : (
        <Table headers={['Logo', 'University Name', 'Actions']}>
          {partners.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <img 
                  src={p.logo} 
                  alt={p.name} 
                  className="w-12 h-12 rounded-full object-cover border border-gray-150 bg-gray-50"
                />
              </TableCell>
              <TableCell className="font-bold text-text-primary text-sm">{p.name}</TableCell>
              <TableCell>
                <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(p.id)}>
                  Delete Logo
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload University Association"
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="University / Institution Name" 
            placeholder="e.g. University of Toronto"
            {...register('name')}
            error={errors.name?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Institution Logo File
              </label>
              <input 
                type="file" 
                accept="image/*"
                {...register('image')}
                className="w-full text-xs text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
            <Input 
              label="OR Paste Image URL" 
              placeholder="https://images.unsplash.com/..."
              {...register('imageUrl')}
              error={errors.imageUrl?.message}
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" loading={submitting}>
              Upload Logo
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete Partner?"
        message="This university association and logo will be permanently removed."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />

    </div>
  );
};

export default PartnersCMS;
