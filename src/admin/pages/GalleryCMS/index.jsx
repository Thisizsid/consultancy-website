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
import { uploadFileApi as uploadFile } from '../../../services/api';
import { ImageIcon, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import { useDashboardStore } from '../../../store/dashboardStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const CATEGORIES = ['Office', 'Events', 'Students', 'Seminars', 'Other'];

const gallerySchema = z.object({
  caption: z.string().min(2, 'Caption must be at least 2 characters'),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Please select a category' }) }),
  image: z.any().optional(),
  imageUrl: z.string().url('Please enter a valid image URL').or(z.string().length(0)).optional(),
});

const GalleryCMS = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, id: null });
  const [filterCategory, setFilterCategory] = useState('All');

  const { showToast } = useUiStore();
  const { fetchStats } = useDashboardStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      caption: '',
      category: 'Office',
      imageUrl: ''
    }
  });

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('gallery');
      // Sort by newest first
      const sorted = data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : 0;
        const dateB = b.createdAt ? new Date(b.createdAt) : 0;
        return dateB - dateA;
      });
      setPhotos(sorted);
    } catch (err) {
      showToast('Error loading gallery photos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleAddClick = () => {
    setEditingPhoto(null);
    reset({
      caption: '',
      category: 'Office',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (photo) => {
    setEditingPhoto(photo);
    reset({
      caption: photo.caption,
      category: photo.category,
      imageUrl: photo.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id });
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteDocument('gallery', confirmState.id);
      showToast('Photo deleted successfully.', 'success');
      fetchPhotos();
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
      let finalImageUrl = formData.imageUrl || '';

      // Handle image file upload (only for new photos or if a new file is selected)
      if (formData.image && formData.image.length > 0) {
        const file = formData.image[0];
        try {
          finalImageUrl = await uploadFile(file, 'gallery');
        } catch (uploadErr) {
          console.warn('Gallery image upload error, using base64 fallback:', uploadErr);
          finalImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
          });
        }
      }

      // For edits where no new image is provided, keep the existing image
      if (editingPhoto && !finalImageUrl) {
        finalImageUrl = editingPhoto.imageUrl;
      }

      if (!finalImageUrl) {
        showToast('Please select an image file or provide an image URL.', 'error');
        setSubmitting(false);
        return;
      }

      const docData = {
        caption: formData.caption,
        category: formData.category,
        imageUrl: finalImageUrl,
      };

      if (editingPhoto) {
        await updateDocument('gallery', editingPhoto.id, docData);
        showToast('Photo updated successfully.', 'success');
      } else {
        await createDocument('gallery', {
          ...docData,
          createdAt: new Date().toISOString(),
        });
        showToast('Photo uploaded successfully.', 'success');
      }

      setIsModalOpen(false);
      fetchPhotos();
      fetchStats();
    } catch (err) {
      showToast('Operation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPhotos = filterCategory === 'All'
    ? photos
    : photos.filter(p => p.category === filterCategory);

  const categoryBadgeVariant = (cat) => {
    const map = {
      'Office': 'info',
      'Events': 'warning',
      'Students': 'success',
      'Seminars': 'accent',
      'Other': 'neutral',
    };
    return map[cat] || 'neutral';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-secondary" /> Gallery CMS
          </h1>
          <p className="text-xs text-text-secondary">Upload and manage photos for the public gallery page.</p>
        </div>
        <Button variant="secondary" size="md" icon={Plus} onClick={handleAddClick}>
          Upload Photo
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-text-secondary" />
        <span className="text-xs font-semibold text-text-secondary mr-1">Filter:</span>
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200
              ${filterCategory === cat
                ? 'bg-secondary text-white shadow-sm'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <Card className="p-8 text-center italic text-text-secondary text-sm">
          {photos.length === 0
            ? 'No photos in the gallery yet. Click "Upload Photo" to add your first one.'
            : `No photos found in the "${filterCategory}" category.`
          }
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-gray-150 bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Image */}
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>

              {/* Info overlay on hover */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                <p className="text-white text-xs font-semibold line-clamp-2">{photo.caption}</p>
              </div>

              {/* Bottom info bar */}
              <div className="p-3 space-y-2">
                <p className="text-xs font-semibold text-text-primary line-clamp-1">{photo.caption}</p>
                <div className="flex items-center justify-between">
                  <Badge variant={categoryBadgeVariant(photo.category)}>
                    {photo.category}
                  </Badge>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditClick(photo)}
                      className="p-1.5 rounded-md text-text-secondary hover:bg-blue-50 hover:text-secondary transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(photo.id)}
                      className="p-1.5 rounded-md text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPhoto ? 'Edit Gallery Photo' : 'Upload Gallery Photo'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Image preview for editing */}
          {editingPhoto && editingPhoto.imageUrl && (
            <div className="rounded-lg overflow-hidden border border-gray-150 bg-gray-50">
              <img
                src={editingPhoto.imageUrl}
                alt="Current"
                className="w-full h-40 object-cover"
              />
              <p className="text-[10px] text-text-secondary text-center py-1.5">Current image — upload a new one below to replace it</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Image File
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

          <Input 
            label="Photo Caption" 
            placeholder="e.g. Students at the Canada Education Fair 2026"
            {...register('caption')}
            error={errors.caption?.message}
          />

          <div>
            <label className="block text-sm font-semibold text-text-primary mb-1">
              Category
            </label>
            <select 
              className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
              {...register('category')}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-xs text-red-600 font-medium">{errors.category.message}</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" loading={submitting}>
              {editingPhoto ? 'Save Changes' : 'Upload Photo'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete Photo?"
        message="This gallery photo will be permanently removed from the website."
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </div>
  );
};

export default GalleryCMS;
