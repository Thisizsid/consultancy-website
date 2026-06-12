import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../../store/authStore';
import { resetAdminPassword, getFriendlyAuthError } from '../../../firebase/auth';
import {
  Compass,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  Send,
  ArrowLeft,
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const resetSchema = z.object({
  resetEmail: z.string().email('Please enter a valid email address'),
});

const MAX_ATTEMPTS = 5;

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuthStore();

  const [authError, setAuthError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  // Forgot-password flow
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState(null);

  // If already authenticated, go to dashboard
  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard');
  }, [isAuthenticated, navigate]);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setSecondsLeft(0);
        clearInterval(interval);
      } else {
        setSecondsLeft(remaining);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil && Date.now() < lockedUntil;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
    reset: resetResetForm,
  } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { resetEmail: '' },
  });

  const onSubmit = async (data) => {
    if (isLocked) return;
    setAuthError(null);
    try {
      await login(data.email, data.password);
      navigate('/admin/dashboard');
    } catch (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setAuthError(getFriendlyAuthError(error));

      // Lock out for 30 seconds after MAX_ATTEMPTS failures
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + 30_000);
      }
    }
  };

  const onResetSubmit = async (data) => {
    setResetError(null);
    setResetLoading(true);
    try {
      await resetAdminPassword(data.resetEmail);
      setResetSent(true);
    } catch (error) {
      setResetError(getFriendlyAuthError(error));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">

        {/* Logo block */}
        <div className="flex flex-col items-center gap-3">
          <div className="bg-secondary text-white p-3.5 rounded-xl shadow-lg shadow-secondary/30">
            <Compass className="w-8 h-8" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-white tracking-wide">LASSO CONSULTANCY</h1>
            <p className="text-xs text-white/50 font-semibold uppercase tracking-widest mt-0.5">
              Admin Control Panel
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

          {/* Card accent bar */}
          <div className="h-1 bg-gradient-to-r from-secondary via-secondary-light to-accent-light" />

          <div className="p-8">
            {!showReset ? (
              /* ─── LOGIN FORM ─── */
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-secondary" /> Sign In
                  </h2>
                  <p className="text-xs text-text-secondary mt-1">
                    Enter your administrator credentials to access the CMS.
                  </p>
                </div>

                {/* Lockout banner */}
                {isLocked && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Too many failed attempts. Please wait{' '}
                      <strong>{secondsLeft}s</strong> before trying again.
                    </span>
                  </div>
                )}

                {/* Error */}
                {authError && !isLocked && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Remaining attempts warning */}
                {attempts > 0 && attempts < MAX_ATTEMPTS && !isLocked && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-xs">
                    {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} remaining before temporary lockout.
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="email"
                        placeholder="admin@yourcompany.com"
                        autoComplete="username"
                        {...register('email')}
                        className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors ${
                          errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...register('password')}
                        className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors ${
                          errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'
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
                    {errors.password && (
                      <p className="text-xs text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Forgot password link */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowReset(true); setAuthError(null); }}
                      className="text-xs text-secondary font-semibold hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !!isLocked}
                    className="w-full py-3 mt-1 rounded-lg bg-secondary text-white font-semibold text-sm
                      hover:bg-secondary-dark active:scale-[0.98] transition-all duration-200
                      disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Verifying…
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Sign In to Console
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ─── FORGOT PASSWORD FORM ─── */
              <>
                <button
                  type="button"
                  onClick={() => { setShowReset(false); setResetSent(false); setResetError(null); resetResetForm(); }}
                  className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary font-semibold mb-5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>

                {!resetSent ? (
                  <>
                    <div className="mb-6">
                      <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                        <Mail className="w-5 h-5 text-secondary" /> Reset Password
                      </h2>
                      <p className="text-xs text-text-secondary mt-1">
                        Enter the email address linked to your admin account and we'll send a reset link.
                      </p>
                    </div>

                    {resetError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{resetError}</span>
                      </div>
                    )}

                    <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                          Admin Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                          <input
                            type="email"
                            placeholder="admin@yourcompany.com"
                            {...registerReset('resetEmail')}
                            className={`w-full pl-9 pr-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary transition-colors ${
                              resetErrors.resetEmail ? 'border-red-400 bg-red-50' : 'border-gray-300'
                            }`}
                          />
                        </div>
                        {resetErrors.resetEmail && (
                          <p className="text-xs text-red-600">{resetErrors.resetEmail.message}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={resetLoading}
                        className="w-full py-3 rounded-lg bg-secondary text-white font-semibold text-sm
                          hover:bg-secondary-dark active:scale-[0.98] transition-all duration-200
                          disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {resetLoading ? (
                          <>
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Sending…
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" /> Send Reset Link
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  /* ─── RESET SENT CONFIRMATION ─── */
                  <div className="py-6 text-center space-y-4">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary text-lg">Check your inbox</h3>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                        A password reset link has been sent to your email address. It may take a minute to arrive.
                      </p>
                    </div>
                    <button
                      onClick={() => { setShowReset(false); setResetSent(false); resetResetForm(); }}
                      className="text-sm text-secondary font-semibold hover:underline"
                    >
                      Return to Sign In
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Card footer */}
          <div className="px-8 py-4 bg-surface border-t border-gray-100 flex items-center justify-between">
            <p className="text-[11px] text-text-muted">
              🔒 Secured by Firebase Authentication
            </p>
            <a href="/" className="text-[11px] text-secondary font-semibold hover:underline">
              ← Public Site
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
