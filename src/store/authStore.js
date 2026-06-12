import { create } from 'zustand';
import {
  signInAdmin,
  signOutAdmin,
  subscribeToAuthChanges,
} from '../firebase/auth';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    loading: false,
    error: null,
  }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await signInAdmin(email, password);
      set({
        user: userCredential.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
      return userCredential.user;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;  // Let Login page handle the friendly message
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOutAdmin();
    } catch (_) {
      // Swallow signOut errors — we always clear state
    } finally {
      set({ user: null, isAuthenticated: false, loading: false, error: null });
    }
  },

  initAuthListener: () => {
    // Only set loading if not yet resolved — prevents double-call from resetting auth state
    if (!get().loading) {
      // Already resolved, just re-subscribe silently
    } else {
      set({ loading: true });
    }

    let resolved = false;
    let unsubscribe = () => {};

    try {
      unsubscribe = subscribeToAuthChanges((user) => {
        resolved = true;
        if (user) {
          set({ user, isAuthenticated: true, loading: false, error: null });
        } else {
          set({ user: null, isAuthenticated: false, loading: false });
        }
      });
    } catch (error) {
      console.warn('Firebase auth listener failed:', error);
      resolved = true;
      set({ loading: false });
    }

    // Safety timeout: unblock UI if Firebase never responds (e.g. offline)
    setTimeout(() => {
      if (!resolved && get().loading) {
        console.warn('Firebase auth timed out — unblocking UI.');
        set({ loading: false });
      }
    }, 2000);

    return unsubscribe;
  },
}));
