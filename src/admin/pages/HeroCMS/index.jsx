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
import { Presentation, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const heroSchema = z.object({
  badge: z.string().min(2, 'Badge text is required'),
  title: z.string().min(2, 'Headline is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  image: z.any().optional(),
  imageUrl: z.string().url('Please enter a valid image URL').or(z.string().length(0)).optional(),
  primaryBtnText: z.string().optional(),
  primaryBtnLink: z.string().optional(),
  secondaryBtnText: z.string().optional(),
  secondaryBtnLink: z.string().optional(),
  order: z.coerce.number().int().min(0, 'Order must be 0 or higher'),
  status: z.enum(['active', 'inactive']),
});

const EMPTY_SLIDE = {
  badge: '',
  title: '',
  description: '',
  imageUrl: '',
  primaryBtnText: '',
  primaryBtnLink: '',
  secondaryBtnText: '',
  secondaryBtnLink: '',
  order: 0,
  status: 'active',
};

const HeroCMS = () => {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, id: null });

  const { showToast } = useUiStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(heroSchema),
    defaultValues: EMPTY_SLIDE,
  });

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('hero');
      setSlides(data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      showToast('Error loading hero slides.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const handleAddClick = () => {
    setEditingSlide(null);
    // Default the new slide to the end of the running order
    reset({ ...EMPTY_SLIDE, order: slides.length });
    setIsModalOpen(true);
  };

  const handleEditClick = (slide) => {
    setEditingSlide(slide);
    reset({
      badge: slide.badge || '',
      title: slide.title || '',
      description: slide.description || '',
      imageUrl: '',
      primaryBtnText: slide.primaryBtnText || '',
      primaryBtnLink: slide.primaryBtnLink || '',
      secondaryBtnText: slide.secondaryBtnText || '',
      secondaryBtnLink: slide.secondaryBtnLink || '',
      order: slide.order ?? 0,
      status: slide.status || 'active',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument('hero', confirmState.id);
      showToast('Hero slide deleted.', 'success');
      fetchSlides();
    } catch (err) {
      showToast('Delete failed.', 'error');
    } finally {
      setConfirmState({ open: false, id: null });
    }
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl || '';

      if (formData.image && formData.image.length > 0) {
        try {
          finalImageUrl = await uploadFile(formData.image[0], 'hero');
        } catch (uploadErr) {
          console.error('Hero image upload failed:', uploadErr);
          showToast('Image upload failed. Please try again.', 'error');
          setSubmitting(false);
          return;
        }
      }

      // Editing without picking a new image keeps the current one
      if (editingSlide && !finalImageUrl) {
        finalImageUrl = editingSlide.image;
      }

      if (!finalImageUrl) {
        showToast('Please upload a background photo or provide an image URL.', 'error');
        setSubmitting(false);
        return;
      }

      const docData = {
        image: finalImageUrl,
        badge: formData.badge,
        title: formData.title,
        description: formData.description,
        primaryBtnText: formData.primaryBtnText || '',
        primaryBtnLink: formData.primaryBtnLink || '',
        secondaryBtnText: formData.secondaryBtnText || '',
        secondaryBtnLink: formData.secondaryBtnLink || '',
        order: formData.order,
        status: formData.status,
      };

      if (editingSlide) {
        await updateDocument('hero', editingSlide.id, docData);
        showToast('Hero slide updated.', 'success');
      } else {
        await createDocument('hero', docData);
        showToast('Hero slide added.', 'success');
      }

      setIsModalOpen(false);
      fetchSlides();
    } catch (err) {
      showToast('Operation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = slides.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Presentation className="w-6 h-6 text-secondary" /> Homepage Hero CMS
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage the rotating slides at the top of the homepage.
          </p>
        </div>
        <Button variant="secondary" size="md" icon={Plus} onClick={handleAddClick}>
          Add Hero Slide
        </Button>
      </div>

      {/* Until at least one active slide exists the homepage keeps using its
          built-in slides, so say so rather than letting the admin wonder why
          nothing changed. */}
      {!loading && activeCount === 0 && (
        <Card className="p-4 flex items-start gap-3 border border-amber-200 bg-amber-50">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 leading-relaxed">
            No active hero slides yet, so the homepage is showing its built-in default slides.
            Add a slide and set it to Active to take over the homepage hero.
          </p>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : slides.length === 0 ? (
        <Card className="p-8 text-center italic text-text-secondary text-sm">
          No hero slides yet. Click "Add Hero Slide" to create the first one.
        </Card>
      ) : (
        <div className="space-y-4">
          {slides.map((slide) => (
            <Card key={slide.id} className="overflow-hidden border border-gray-150">
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="md:w-64 shrink-0 h-40 md:h-auto bg-gray-100 relative">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
                    #{slide.order ?? 0}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                        {slide.badge}
                      </p>
                      <h3 className="font-bold text-text-primary text-base mt-0.5">{slide.title}</h3>
                    </div>
                    {slide.status === 'active' ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="neutral">Inactive</Badge>
                    )}
                  </div>

                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {slide.description}
                  </p>

                  <div className="flex flex-wrap gap-2 text-[11px] text-text-secondary">
                    {slide.primaryBtnText && (
                      <span className="px-2 py-1 rounded bg-gray-100 font-medium">
                        {slide.primaryBtnText} → {slide.primaryBtnLink || '(no link)'}
                      </span>
                    )}
                    {slide.secondaryBtnText && (
                      <span className="px-2 py-1 rounded bg-gray-100 font-medium">
                        {slide.secondaryBtnText} → {slide.secondaryBtnLink || '(no link)'}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleEditClick(slide)}>
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(slide.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {editingSlide && editingSlide.image && (
            <div className="rounded-lg overflow-hidden border border-gray-150 bg-gray-50">
              <img src={editingSlide.image} alt="Current" className="w-full h-36 object-cover" />
              <p className="text-[10px] text-text-secondary text-center py-1.5">
                Current background — upload a new one below to replace it
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Background Photo
              </label>
              <input
                type="file"
                accept="image/*"
                {...register('image')}
                className="w-full text-xs text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="mt-1 text-[11px] text-text-secondary">
                Wide landscape photo, ideally 1600px or wider.
              </p>
            </div>
            <Input
              label="OR Paste Image URL"
              placeholder="https://..."
              {...register('imageUrl')}
              error={errors.imageUrl?.message}
            />
          </div>

          <Input
            label="Badge Text"
            placeholder="e.g. Trusted Global Admissions Partner"
            {...register('badge')}
            error={errors.badge?.message}
          />

          <Input
            label="Headline"
            placeholder="e.g. Study Abroad with Lasso Consultancy"
            {...register('title')}
            error={errors.title?.message}
          />

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Short supporting sentence shown under the headline."
              {...register('description')}
              className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors text-sm"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Primary Button Text"
              placeholder="e.g. Book Free Consultation"
              {...register('primaryBtnText')}
            />
            <Input
              label="Primary Button Link"
              placeholder="e.g. #contact-section"
              {...register('primaryBtnLink')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Secondary Button Text"
              placeholder="e.g. Explore Countries"
              {...register('secondaryBtnText')}
            />
            <Input
              label="Secondary Button Link"
              placeholder="e.g. /countries"
              {...register('secondaryBtnLink')}
            />
          </div>
          <p className="-mt-2 text-[11px] text-text-secondary">
            Use a path like <code>/countries</code> for a page, or <code>#contact-section</code> to
            jump to the homepage booking form. Leave a button's text blank to hide it.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Display Order"
              type="number"
              min="0"
              {...register('order')}
              error={errors.order?.message}
            />
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Status
              </label>
              <select
                className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                {...register('status')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" loading={submitting}>
              {editingSlide ? 'Save Changes' : 'Add Slide'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete Hero Slide?"
        message="This slide will be permanently removed from the homepage hero."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </div>
  );
};

export default HeroCMS;
