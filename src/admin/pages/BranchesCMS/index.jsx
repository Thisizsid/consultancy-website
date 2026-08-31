import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  getAllDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../../../services/api';
import { uploadFileApi as uploadFile } from '../../../services/api';
import { GitBranch, Plus, Edit2, Trash2, MapPin, Phone, Mail, Clock, ExternalLink } from 'lucide-react';
import { mapLinkFor } from '../../../utils/maps';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import { useDashboardStore } from '../../../store/dashboardStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const optionalUrl = z
  .string()
  .url('Please enter a valid URL (including https://)')
  .or(z.string().length(0))
  .optional();

const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  address: z.string().min(5, 'Full address is required'),
  city: z.string().min(2, 'City is required'),
  phone: z.string().min(6, 'Phone number is required'),
  email: z.string().email('Please enter a valid email address'),
  openingHours: z.string().min(3, 'Opening hours are required (e.g. Mon–Fri: 9AM – 6PM)'),
  status: z.enum(['active', 'inactive']),
  mapUrl: z.string().url('Please enter a valid map link (including https://)').or(z.string().length(0)).optional(),
  facebook: optionalUrl,
  instagram: optionalUrl,
  tiktok: optionalUrl,
  photo1: z.any().optional(),
  photo1Url: optionalUrl,
  photo2: z.any().optional(),
  photo2Url: optionalUrl,
});

const BranchesCMS = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, id: null });

  const { showToast } = useUiStore();
  const { fetchStats } = useDashboardStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      openingHours: '',
      status: 'active',
      mapUrl: '',
      facebook: '',
      instagram: '',
      tiktok: '',
      photo1Url: '',
      photo2Url: '',
    },
  });

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('branches');
      const sorted = data.sort((a, b) => a.name.localeCompare(b.name));
      setBranches(sorted);
    } catch (err) {
      showToast('Error loading branches.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAddClick = () => {
    setEditingBranch(null);
    reset({
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      openingHours: '',
      status: 'active',
      mapUrl: '',
      facebook: '',
      instagram: '',
      tiktok: '',
      photo1Url: '',
      photo2Url: '',
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (branch) => {
    setEditingBranch(branch);
    reset({
      name: branch.name,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      email: branch.email,
      openingHours: branch.openingHours,
      status: branch.status,
      mapUrl: branch.mapUrl || '',
      facebook: branch.facebook || '',
      instagram: branch.instagram || '',
      tiktok: branch.tiktok || '',
      photo1Url: '',
      photo2Url: '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument('branches', confirmState.id);
      showToast('Branch deleted successfully.', 'success');
      fetchBranches();
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
      const { photo1, photo1Url, photo2, photo2Url, ...rest } = formData;

      let finalPhoto1 = photo1Url || '';
      if (photo1 && photo1.length > 0) {
        try {
          finalPhoto1 = await uploadFile(photo1[0], 'branches');
        } catch (uploadErr) {
          console.error('Branch photo 1 upload failed:', uploadErr);
          showToast('Photo 1 upload failed. Please try again.', 'error');
          setSubmitting(false);
          return;
        }
      }
      if (editingBranch && !finalPhoto1) {
        finalPhoto1 = editingBranch.photo1 || '';
      }

      let finalPhoto2 = photo2Url || '';
      if (photo2 && photo2.length > 0) {
        try {
          finalPhoto2 = await uploadFile(photo2[0], 'branches');
        } catch (uploadErr) {
          console.error('Branch photo 2 upload failed:', uploadErr);
          showToast('Photo 2 upload failed. Please try again.', 'error');
          setSubmitting(false);
          return;
        }
      }
      if (editingBranch && !finalPhoto2) {
        finalPhoto2 = editingBranch.photo2 || '';
      }

      const docData = { ...rest, photo1: finalPhoto1, photo2: finalPhoto2 };

      if (editingBranch) {
        await updateDocument('branches', editingBranch.id, docData);
        showToast('Branch updated successfully.', 'success');
      } else {
        await createDocument('branches', docData);
        showToast('Branch created successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchBranches();
      fetchStats();
    } catch (err) {
      showToast('Operation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-secondary" /> Branches CMS
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage all consultancy office locations and branch contact details.
          </p>
        </div>
        <Button variant="secondary" size="md" icon={Plus} onClick={handleAddClick}>
          Add New Branch
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : branches.length === 0 ? (
        <Card className="p-8 text-center italic text-text-secondary text-sm">
          No branches added yet. Click "Add New Branch" to get started.
        </Card>
      ) : (
        <Table headers={['Status', 'Branch Name', 'Location', 'Contact', 'Hours', 'Actions']}>
          {branches.map((branch) => (
            <TableRow key={branch.id}>
              <TableCell>
                {branch.status === 'active' ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="neutral">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>
                <p className="font-bold text-text-primary text-sm">{branch.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">{branch.city}</p>
              </TableCell>
              <TableCell className="text-xs max-w-xs">
                <span className="flex items-start gap-1 text-text-secondary">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{branch.address}</span>
                </span>
                <a
                  href={mapLinkFor(branch)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:underline"
                >
                  {branch.mapUrl ? 'Pinned link' : 'Searched by address'}
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </TableCell>
              <TableCell className="text-xs space-y-1">
                <span className="flex items-center gap-1 text-text-secondary">
                  <Phone className="w-3.5 h-3.5 text-secondary shrink-0" /> {branch.phone}
                </span>
                <span className="flex items-center gap-1 text-text-secondary">
                  <Mail className="w-3.5 h-3.5 text-secondary shrink-0" /> {branch.email}
                </span>
              </TableCell>
              <TableCell className="text-xs">
                <span className="flex items-center gap-1 text-text-secondary">
                  <Clock className="w-3.5 h-3.5 text-accent shrink-0" /> {branch.openingHours}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleEditClick(branch)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(branch.id)}>
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBranch ? 'Edit Branch Details' : 'Add New Branch'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Branch Name"
              placeholder="e.g. Kathmandu Main Office"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input
              label="City"
              placeholder="e.g. Kathmandu"
              {...register('city')}
              error={errors.city?.message}
            />
          </div>

          <Input
            label="Full Address"
            placeholder="e.g. 3rd Floor, Putalisadak, Kathmandu, Nepal"
            {...register('address')}
            error={errors.address?.message}
          />

          <div>
            <Input
              label="Google Maps Link (optional)"
              placeholder="https://maps.app.goo.gl/..."
              {...register('mapUrl')}
              error={errors.mapUrl?.message}
            />
            <p className="mt-1 text-[11px] text-text-secondary">
              Open the branch in Google Maps, tap Share, and paste the link here to pin the exact
              entrance. Leave blank and the Get Directions button will search by the address above.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="e.g. +977-1-4567890"
              {...register('phone')}
              error={errors.phone?.message}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. kathmandu@lasso.com"
              {...register('email')}
              error={errors.email?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Opening Hours"
              placeholder="e.g. Mon–Fri: 9AM – 6PM, Sat: 10AM – 4PM"
              {...register('openingHours')}
              error={errors.openingHours?.message}
            />
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Branch Status
              </label>
              <select
                className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                {...register('status')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-xs text-red-600 font-medium">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-text-primary">Branch Photos (optional)</h3>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              Up to two photos of this office, shown on the branch card.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((n) => {
                const currentUrl = editingBranch?.[`photo${n}`];
                return (
                  <div key={n} className="space-y-2">
                    {currentUrl && (
                      <div className="rounded-lg overflow-hidden border border-gray-150 bg-gray-50">
                        <img src={currentUrl} alt={`Current photo ${n}`} className="w-full h-28 object-cover" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-1">
                        Photo {n}
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        {...register(`photo${n}`)}
                        className="w-full text-xs text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100 cursor-pointer"
                      />
                    </div>
                    <Input
                      label={`OR Paste Image URL (Photo ${n})`}
                      placeholder="https://..."
                      {...register(`photo${n}Url`)}
                      error={errors[`photo${n}Url`]?.message}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-text-primary">Social Media (optional)</h3>
            <p className="mt-0.5 text-[11px] text-text-secondary">
              Links to this branch's own pages. Leave blank to hide the icon on the branch card.
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Facebook"
                placeholder="https://facebook.com/branchpage"
                {...register('facebook')}
                error={errors.facebook?.message}
              />
              <Input
                label="Instagram"
                placeholder="https://instagram.com/branchhandle"
                {...register('instagram')}
                error={errors.instagram?.message}
              />
              <Input
                label="TikTok"
                placeholder="https://tiktok.com/@branchhandle"
                {...register('tiktok')}
                error={errors.tiktok?.message}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" loading={submitting}>
              {editingBranch ? 'Update Branch' : 'Save Branch'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete Branch?"
        message="This branch location will be permanently removed from the system."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </div>
  );
};

export default BranchesCMS;
