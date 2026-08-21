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
import { GitBranch, Plus, Edit2, Trash2, MapPin, Phone, Mail, Clock } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Table, { TableRow, TableCell } from '../../../components/ui/Table';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import { useUiStore } from '../../../store/uiStore';
import { useDashboardStore } from '../../../store/dashboardStore';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';

const branchSchema = z.object({
  name: z.string().min(2, 'Branch name must be at least 2 characters'),
  address: z.string().min(5, 'Full address is required'),
  city: z.string().min(2, 'City is required'),
  phone: z.string().min(6, 'Phone number is required'),
  email: z.string().email('Please enter a valid email address'),
  openingHours: z.string().min(3, 'Opening hours are required (e.g. Mon–Fri: 9AM – 6PM)'),
  status: z.enum(['active', 'inactive']),
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
      if (editingBranch) {
        await updateDocument('branches', editingBranch.id, formData);
        showToast('Branch updated successfully.', 'success');
      } else {
        await createDocument('branches', formData);
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
