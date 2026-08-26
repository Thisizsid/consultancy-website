import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getAllDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from '../../../services/api';
import { Briefcase, Plus, Edit2, Trash2, Compass, School, FileText, CheckSquare, Edit3, Award } from 'lucide-react';
import Card, { CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import { useDashboardStore } from '../../../store/dashboardStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { slugify } from '../../../utils/slug';

const serviceSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  slug: z.string()
    .min(2, 'URL slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens only'),
  icon: z.enum(['Compass', 'School', 'FileText', 'CheckSquare', 'Edit3', 'Award'], 'Please select an icon representation'),
  description: z.string().min(10, 'Short description must be at least 10 characters'),
  longDescription: z.string().max(8000, 'Overview is too long').optional(),
  // Edited as one bullet-per-line textarea; split into `includes` on submit.
  includesText: z.string().optional(),
});

const iconMap = {
  Compass: Compass,
  School: School,
  FileText: FileText,
  CheckSquare: CheckSquare,
  Edit3: Edit3,
  Award: Award
};

const ServicesCMS = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, id: null });

  const { showToast } = useUiStore();
  const { fetchStats } = useDashboardStore();

  // While adding a new service the slug tracks the title, until the admin
  // types their own. On an existing service it never auto-changes — the page
  // is already published at that URL.
  const [slugTouched, setSlugTouched] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: '',
      slug: '',
      icon: 'Compass',
      description: '',
      longDescription: '',
      includesText: ''
    }
  });

  const titleValue = watch('title');
  // Hoisted so the slug input can wrap RHF's onChange without re-registering
  // the field on every keystroke.
  const slugField = register('slug');

  useEffect(() => {
    if (editingService || slugTouched) return;
    setValue('slug', slugify(titleValue || ''), { shouldValidate: false });
  }, [titleValue, editingService, slugTouched, setValue]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('services');
      setServices(data);
    } catch (error) {
      showToast('Error fetching services.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddClick = () => {
    setEditingService(null);
    setSlugTouched(false);
    reset({
      title: '',
      slug: '',
      icon: 'Compass',
      description: '',
      longDescription: '',
      includesText: ''
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (serviceItem) => {
    setEditingService(serviceItem);
    setSlugTouched(true);
    reset({
      title: serviceItem.title,
      // Services created before detail pages existed have no stored slug —
      // show the derived one their page is already reachable at.
      slug: serviceItem.slug || slugify(serviceItem.title),
      icon: serviceItem.icon,
      description: serviceItem.description,
      longDescription: serviceItem.longDescription || '',
      includesText: (serviceItem.includes || []).join('\n')
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument('services', confirmState.id);
      showToast('Service deleted.', 'success');
      fetchServices();
      fetchStats();
    } catch (err) {
      showToast('Delete failed.', 'error');
    } finally {
      setConfirmState({ open: false, id: null });
    }
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    // `includesText` is a UI-only field — the API stores a string array, and
    // its schema is strict, so it has to be stripped rather than passed on.
    const { includesText, longDescription, ...rest } = formData;
    const payload = {
      ...rest,
      longDescription: (longDescription || '').trim(),
      includes: (includesText || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    };
    try {
      if (editingService) {
        await updateDocument('services', editingService.id, payload);
        showToast('Service updated.', 'success');
      } else {
        await createDocument('services', payload);
        showToast('Service added.', 'success');
      }
      setIsModalOpen(false);
      fetchServices();
      fetchStats();
    } catch (err) {
      showToast('Action failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-secondary" /> Services CMS
          </h1>
          <p className="text-xs text-text-secondary">Each service gets its own page at /services/&lt;url&gt;.</p>
        </div>
        <Button variant="secondary" size="md" icon={Plus} onClick={handleAddClick}>
          Add New Service
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : services.length === 0 ? (
        <Card className="p-8 text-center italic text-text-secondary text-sm">
          No services defined. Click "Add New Service" to create one.
        </Card>
      ) : (
        <Table headers={['Icon', 'Title', 'Description', 'Actions']}>
          {services.map((s) => {
            const IconEl = iconMap[s.icon] || Compass;
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="w-8 h-8 rounded-md bg-blue-50 text-secondary flex items-center justify-center">
                    <IconEl className="w-4 h-4" />
                  </div>
                </TableCell>
                <TableCell className="font-bold text-text-primary">
                  {s.title}
                  <span className="block text-[11px] font-mono font-normal text-text-secondary">
                    /services/{s.slug || slugify(s.title)}
                  </span>
                </TableCell>
                <TableCell className="max-w-md truncate">{s.description}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleEditClick(s)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(s.id)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? 'Modify Service' : 'Create Service'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Service Title"
            placeholder="e.g. Visa Guidance"
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <Input
              label="Page URL"
              placeholder="e.g. visa-guidance"
              {...slugField}
              onChange={(e) => {
                setSlugTouched(true);
                return slugField.onChange(e);
              }}
              error={errors.slug?.message}
            />
            <p className="mt-1 text-xs text-text-secondary">
              This service will live at <span className="font-mono font-semibold">/services/{watch('slug') || '…'}</span>
              {editingService && ' — changing it breaks any existing links.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">
              Design System Icon
            </label>
            <select 
              className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
              {...register('icon')}
            >
              <option value="Compass">Compass (Counseling)</option>
              <option value="School">School (University Matches)</option>
              <option value="FileText">FileText (Application Files)</option>
              <option value="CheckSquare">CheckSquare (Visa Guidance)</option>
              <option value="Edit3">Edit3 (SOP & Letter Editing)</option>
              <option value="Award">Award (Scholarship Assistance)</option>
            </select>
            {errors.icon && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.icon.message}</p>
            )}
          </div>

          <Input
            label="Short Description"
            type="textarea"
            rows={2}
            placeholder="One or two lines — shown on the services grid and the nav dropdown."
            {...register('description')}
            error={errors.description?.message}
          />

          <Input
            label="Full Overview (service page)"
            type="textarea"
            rows={6}
            placeholder="The long-form explanation shown on this service's own page. Leave blank to reuse the short description."
            {...register('longDescription')}
            error={errors.longDescription?.message}
          />

          <div>
            <Input
              label="What's Included"
              type="textarea"
              rows={5}
              placeholder={'One item per line, e.g.\nDocument checklist review\nMock visa interview\nFinancial statement guidance'}
              {...register('includesText')}
              error={errors.includesText?.message}
            />
            <p className="mt-1 text-xs text-text-secondary">
              One bullet per line. Leave blank to hide the section on the service page.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" loading={submitting}>
              Save Service
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete Service?"
        message="This service card will be permanently removed."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />

    </div>
  );
};

export default ServicesCMS;
