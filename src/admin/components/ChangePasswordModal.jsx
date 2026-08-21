import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle2, KeyRound } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { changeAdminPassword, getFriendlyAuthError } from '../../services/auth';
import { useUiStore } from '../../store/uiStore';

// Mirrors the server-side rule in routes/auth.js (min 6 chars)
const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'New password must be different from the current one',
    path: ['newPassword'],
  });

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');
  const { showToast } = useUiStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const close = () => {
    reset();
    setServerError('');
    setSuccess(false);
    onClose();
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    setServerError('');
    try {
      await changeAdminPassword(data.currentPassword, data.newPassword);
      setSuccess(true);
      showToast('Password changed successfully.', 'success');
      reset();
    } catch (err) {
      setServerError(getFriendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={close} title="Change Password" size="sm">
      {success ? (
        <div className="text-center py-6 space-y-4">
          <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
          <h4 className="text-lg font-bold text-primary">Password Updated</h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your new password is active. Use it the next time you sign in.
          </p>
          <Button variant="outline" className="w-full" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-md bg-blue-50 border border-blue-100">
            <KeyRound className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Enter your current password to confirm it's you, then choose a new one
              (minimum 6 characters).
            </p>
          </div>

          <Input
            label="Current Password"
            type="password"
            autoComplete="current-password"
            placeholder="Your existing password"
            {...register('currentPassword')}
            error={errors.currentPassword?.message}
          />
          <Input
            label="New Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 6 characters"
            {...register('newPassword')}
            error={errors.newPassword?.message}
          />
          <Input
            label="Confirm New Password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter the new password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />

          {serverError && (
            <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {serverError}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:flex-1"
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              className="w-full sm:flex-1"
              loading={submitting}
            >
              Update Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ChangePasswordModal;
