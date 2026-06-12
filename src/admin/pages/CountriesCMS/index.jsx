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
import { Globe, Plus, Edit2, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import Card, { CardBody } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import { useDashboardStore } from '../../../store/dashboardStore';

// Validation schema for country creation / editing
const countryFormSchema = z.object({
  name: z.string().min(2, 'Country name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric and hyphens only'),
  flag: z.string().min(1, 'Please enter a flag emoji (e.g. 🇨🇦)'),
  image: z.any().optional(),
  imageUrl: z.string().url('Please enter a valid image URL').or(z.string().length(0)),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  popularCourses: z.string().min(2, 'List at least one popular course'),
  tuitionFees: z.string().min(2, 'Provide tuition fees details'),
  livingCost: z.string().min(2, 'Provide living cost details'),
  visaProcess: z.string().min(5, 'Provide visa process details'),
  visible: z.boolean().default(true),
});

const CountriesCMS = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  const { showToast } = useUiStore();
  const { fetchStats } = useDashboardStore();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(countryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      flag: '',
      imageUrl: '',
      description: '',
      popularCourses: '',
      tuitionFees: '',
      livingCost: '',
      visaProcess: '',
      visible: true
    }
  });

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const data = await getAllDocuments('countries');
      setCountries(data);
    } catch (error) {
      showToast('Error loading countries.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  // Sync edit country to form
  const handleEditClick = (countryItem) => {
    setEditingCountry(countryItem);
    reset({
      name: countryItem.name,
      slug: countryItem.slug,
      flag: countryItem.flag,
      imageUrl: countryItem.image || '',
      description: countryItem.description,
      popularCourses: countryItem.popularCourses,
      tuitionFees: countryItem.tuitionFees,
      livingCost: countryItem.livingCost,
      visaProcess: countryItem.visaProcess || '',
      visible: countryItem.visible !== false
    });
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingCountry(null);
    reset({
      name: '',
      slug: '',
      flag: '',
      imageUrl: '',
      description: '',
      popularCourses: '',
      tuitionFees: '',
      livingCost: '',
      visaProcess: '',
      visible: true
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (!window.confirm('Are you sure you want to delete this country study destination?')) return;
    try {
      await deleteDocument('countries', id);
      showToast('Country deleted successfully.', 'success');
      fetchCountries();
      fetchStats();
    } catch (err) {
      showToast('Delete failed.', 'error');
    }
  };

  const handleToggleVisibility = async (countryItem) => {
    try {
      const nextVal = !countryItem.visible;
      await updateDocument('countries', countryItem.id, { visible: nextVal });
      showToast(`${countryItem.name} visibility toggled.`, 'success');
      fetchCountries();
    } catch (err) {
      showToast('Failed to toggle visibility.', 'error');
    }
  };

  const onSubmit = async (formData) => {
    setFormSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // Handle file upload if present
      if (formData.image && formData.image.length > 0) {
        const file = formData.image[0];
        try {
          finalImageUrl = await uploadFile(file, 'countries');
        } catch (uploadErr) {
          console.warn('Storage upload error, using local fallback:', uploadErr);
          // Standard base64 fallback for dev compatibility
          finalImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
          });
        }
      }

      if (!finalImageUrl) {
        // Default banner image if nothing provided
        finalImageUrl = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800';
      }

      const savePayload = {
        name: formData.name,
        slug: formData.slug,
        flag: formData.flag,
        image: finalImageUrl,
        description: formData.description,
        popularCourses: formData.popularCourses,
        tuitionFees: formData.tuitionFees,
        livingCost: formData.livingCost,
        visaProcess: formData.visaProcess,
        visible: formData.visible
      };

      if (editingCountry) {
        await updateDocument('countries', editingCountry.id, savePayload);
        showToast('Country updated successfully.', 'success');
      } else {
        await createDocument('countries', savePayload);
        showToast('Country added successfully.', 'success');
      }

      setIsModalOpen(false);
      fetchCountries();
      fetchStats();
    } catch (err) {
      console.error(err);
      showToast('Operation failed.', 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Generate slug dynamically from name
  const nameValue = watch('name');
  useEffect(() => {
    if (nameValue && !editingCountry) {
      const slugVal = nameValue
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
      setValue('slug', slugVal, { shouldValidate: true });
    }
  }, [nameValue, setValue, editingCountry]);

  // Filter listings
  const filteredCountries = countries.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary flex items-center gap-2">
            <Globe className="w-6 h-6 text-secondary" /> Countries Manager
          </h1>
          <p className="text-xs text-text-secondary">Configure the destination profiles that students explore on the website.</p>
        </div>
        <Button variant="secondary" size="md" icon={Plus} onClick={handleAddClick}>
          Add New Country
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="bg-white border border-gray-150">
        <CardBody className="p-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search by country name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm text-text-primary placeholder-gray-400 focus:ring-0"
          />
        </CardBody>
      </Card>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredCountries.length === 0 ? (
        <Card className="bg-white p-8 text-center italic text-text-secondary border border-gray-150 text-sm">
          No study destinations match your search or exist in the system. Click "Add New Country" to create one.
        </Card>
      ) : (
        <Table headers={['Flag', 'Name', 'Slug', 'Tuition Rate', 'Visible', 'Actions']}>
          {filteredCountries.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-2xl">{c.flag}</TableCell>
              <TableCell className="font-bold text-text-primary">{c.name}</TableCell>
              <TableCell className="font-mono text-xs text-text-secondary">{c.slug}</TableCell>
              <TableCell>{c.tuitionFees?.split('/')[0] || 'N/A'}</TableCell>
              <TableCell>
                <button 
                  onClick={() => handleToggleVisibility(c)}
                  className="p-1 rounded-md hover:bg-gray-100 transition-colors"
                  title="Toggle Visibility"
                >
                  {c.visible !== false ? (
                    <Badge variant="success" className="cursor-pointer">
                      <Eye className="w-3.5 h-3.5 mr-1" /> Visible
                    </Badge>
                  ) : (
                    <Badge variant="danger" className="cursor-pointer">
                      <EyeOff className="w-3.5 h-3.5 mr-1" /> Hidden
                    </Badge>
                  )}
                </button>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleEditClick(c)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteClick(c.id)}>
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
        title={editingCountry ? `Modify Destination Profile: ${editingCountry.name}` : 'Create Destination Profile'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Country Name" 
              placeholder="e.g. Canada"
              {...register('name')}
              error={errors.name?.message}
            />
            <Input 
              label="Slug (Auto-generated)" 
              placeholder="e.g. canada"
              {...register('slug')}
              error={errors.slug?.message}
            />
            <Input 
              label="Flag Emoji" 
              placeholder="e.g. 🇨🇦"
              {...register('flag')}
              error={errors.flag?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-1">
                Image Banner File (Upload to storage)
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
            label="Short overview paragraph"
            type="textarea"
            rows={3}
            placeholder="Introduce the academic infrastructure and study culture..."
            {...register('description')}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input 
              label="Popular Courses (Comma separated)" 
              placeholder="e.g. Computer Science, MBA, Engineering"
              {...register('popularCourses')}
              error={errors.popularCourses?.message}
            />
            <Input 
              label="Tuition Fees Average" 
              placeholder="e.g. CAD 15,000 - 30,000 / year"
              {...register('tuitionFees')}
              error={errors.tuitionFees?.message}
            />
            <Input 
              label="Living Cost Average" 
              placeholder="e.g. CAD 15,000 / year"
              {...register('livingCost')}
              error={errors.livingCost?.message}
            />
          </div>

          <Input 
            label="Visa Rules / Documentation Steps"
            type="textarea"
            rows={3}
            placeholder="Detail student permit requirements, medical certificates, funds..."
            {...register('visaProcess')}
            error={errors.visaProcess?.message}
          />

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="visible"
              {...register('visible')}
              className="rounded text-secondary focus:ring-secondary"
            />
            <label htmlFor="visible" className="text-sm font-semibold text-text-primary">
              Mark visible on the public website listings
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" loading={formSubmitting}>
              Save Profile
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default CountriesCMS;
