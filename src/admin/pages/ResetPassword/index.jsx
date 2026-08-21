import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { completePasswordReset } from '../../../services/auth';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import logo from '../../../assets/logo.png';

const resetSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const onSubmit = async (data) => {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await completePasswordReset(token, data.newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/admin/login'), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <img src={logo} alt="Lasso Consultancy" className="h-24 w-24 object-contain drop-shadow-md" />
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-primary tracking-wide">LASSO CONSULTANCY</h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest mt-0.5">Admin Password Reset</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-secondary via-secondary-light to-accent-light" />

          <div className="p-8">
            {success ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                <h2 className="text-xl font-bold text-primary">Password Reset!</h2>
                <p className="text-sm text-text-secondary">
                  Your password has been updated. Redirecting to login…
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-secondary" /> Set New Password
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Choose a strong password for your admin account.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {!token ? (
                  <Link
                    to="/admin/login"
                    className="flex items-center gap-1 text-sm text-secondary font-semibold hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </Link>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* New Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                        New Password
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...register('newPassword')}
                          className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors ${
                            errors.newPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="text-xs text-red-600">{errors.newPassword.message}</p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="••••••••"
                          {...register('confirmPassword')}
                          className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors ${
                            errors.confirmPassword ? 'border-red-400 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 mt-1 rounded-lg bg-secondary text-white font-semibold text-sm
                        hover:bg-secondary-dark active:scale-[0.98] transition-all duration-200
                        disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Resetting…
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" /> Reset Password
                        </>
                      )}
                    </button>

                    <div className="text-center">
                      <Link to="/admin/login" className="text-xs text-secondary font-semibold hover:underline inline-flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Back to Sign In
                      </Link>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>

          <div className="px-8 py-4 bg-surface border-t border-gray-100 flex items-center justify-between">
            <p className="text-[11px] text-text-muted flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
              Secured Admin Authentication
            </p>
            <a href="/" className="text-[11px] text-secondary font-semibold hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Public Site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
