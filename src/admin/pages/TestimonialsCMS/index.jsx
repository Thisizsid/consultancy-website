import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getAllDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument 
} from '../../../firebase/firestore';
import { uploadFile } from '../../../firebase/storage';
import { MessageSquare, Plus, Edit2, Trash2, Star } from 'lucide-react';
import Card, { CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import { useDashboardStore } from '../../../store/dashboardStore';

const testimonialSchema = z.object({
  studentName: z.string().min(2, 'Name must be at least 2 characters'),
  country: z.string().min(2, 'Country name is required'),
  text: z.string().min(10, 'Review must be at least 10 characters'),
  rating: z.coerce.number().min(1).max(5),
  image: z.any().optional(),
  imageUrl: z.string().url('Please enter a valid image URL').or(z.string().length(0)),
});

const TestimonialsCMS = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useUiStore();
  const { fetchStats } = useDashboardStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      studentName: '',
      country: '',
      text: '',
      rating: 5,
      imageUrl: ''
    }
  });

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('testimonials');
      setTestimonials(data);
    } catch (err) {
      showToast('Error loading testimonials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleAddClick = () => {
    setEditingTestimonial(null);
    reset({
      studentName: '',
      country: '',
      text: '',
      rating: 5,
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (testimonialItem) => {
    setEditingTestimonial(testimonialItem);
    reset({
      studentName: testimonialItem.studentName,
      country: testimonialItem.country,
      text: testimonialItem.text,
      rating: testimonialItem.rating || 5,
      imageUrl: testimonialItem.image || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await deleteDocument('testimonials', id);
      showToast('Testimonial deleted.', 'success');
      fetchTestimonials();
      fetchStats();
    } catch (err) {
      showToast('Delete failed.', 'error');
    }
  };

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // Handle image file upload
      if (formData.image && formData.image.length > 0) {
        const file = formData.image[0];
        try {
          finalImageUrl = await uploadFile(file, 'testimonials');
        } catch (uploadErr) {
          console.warn('Testimonial upload error, using local fallback:', uploadErr);
          // Standard base64 fallback
          finalImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
          });
        }
      }

      if (!finalImageUrl) {
        // Fallback placeholder image
        finalImageUrl = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200';
      }

      const savePayload = {
        studentName: formData.studentName,
        country: formData.country,
        text: formData.text,
        rating: formData.rating,
        image: finalImageUrl
      };

      if (editingTestimonial) {
        await updateDocument('testimonials', editingTestimonial.id, savePayload);
        showToast('Testimonial updated successfully.', 'success');
      } else {
        await createDocument('testimonials', savePayload);
        showToast('Testimonial added successfully.', 'success');
      }

      setIsModalOpen(false);
      fetchTestimonials();
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
            <MessageSquare className="w-6 h-6 text-secondary" /> Testimonials CMS
          </h1>
          <p className="text-xs text-text-secondary">Manage reviews shared by student success stories.</p>
        </div>
        <Button variant="secondary" size="md" icon={Plus} onClick={handleAddClick}>
          Add Testimonial
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : testimonials.length === 0 ? (
        <Card className="p-8 text-center italic text-text-secondary text-sm">
          No student success testimonials configured. Click "Add Testimonial" to make one.
        </Card>
      ) : (
        <Table headers={['Student Photo', 'Student Details', 'Rating', 'Review Quote', 'Actions']}>
          {testimonials.map((t) => (
            <TableRow key={t.id}>
              <TableCell>
                <img 
                  src={t.image} 
                  alt={t.studentName} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              </TableCell>
              <TableCell>
                <p className="font-bold text-text-primary text-sm">{t.studentName}</p>
                <p className="text-xs text-text-secondary">Studying in {t.country}</p>
              </TableCell>
              <TableCell>
                <div className="flex text-amber-500 gap-0.5">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
              </TableCell>
              <TableCell className="max-w-xs truncate italic">"{t.text}"</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleEditClick(t)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(t.id)}>
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
        title={editingTestimonial ? 'Modify Student Review' : 'Create Student Review'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Student Name" 
              placeholder="e.g. Elena Smith"
              {...register('studentName')}
              error={errors.studentName?.message}
            />

            <Input 
              label="Destination Country" 
              placeholder="e.g. Australia"
              {...register('country')}
              error={errors.country?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Student Star Rating
              </label>
              <select 
                className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                {...register('rating')}
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Student Profile Pic
              </label>
              <input 
                type="file" 
                accept="image/*"
                {...register('image')}
                className="w-full text-xs text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-secondary hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>

          <Input 
            label="OR Paste Profile Pic URL" 
            placeholder="https://images.unsplash.com/..."
            {...register('imageUrl')}
            error={errors.imageUrl?.message}
          />

          <Input 
            label="Review Quote Text"
            type="textarea"
            placeholder="Describe the student's admission success, experience, and appreciation..."
            {...register('text')}
            error={errors.text?.message}
          />

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" loading={submitting}>
              Save Testimonial
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default TestimonialsCMS;
