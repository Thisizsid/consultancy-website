import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from './config';

/**
 * Sign in admin user using Firebase Auth
 */
export const signInAdmin = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

/**
 * Sign out admin user
 */
export const signOutAdmin = async () => {
  await signOut(auth);
};

/**
 * Send a password reset email
 */
export const resetAdminPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Listen for auth state changes
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Map raw Firebase Auth error codes to clean user-facing messages
 */
export const getFriendlyAuthError = (error) => {
  const code = error?.code || '';
  const map = {
    'auth/invalid-credential':       'Incorrect email or password. Please try again.',
    'auth/user-not-found':           'No account found with this email address.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/invalid-email':            'The email address format is invalid.',
    'auth/user-disabled':            'This admin account has been disabled.',
    'auth/too-many-requests':        'Too many failed attempts. Please wait a few minutes before trying again.',
    'auth/network-request-failed':   'Network error. Check your connection and try again.',
    'auth/operation-not-allowed':    'Email/password sign-in is not enabled in Firebase.',
    'auth/missing-password':         'Password is required.',
  };
  return map[code] || 'Authentication failed. Please check your credentials.';
};
