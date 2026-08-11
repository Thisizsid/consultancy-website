import { create } from 'zustand';

export const useUiStore = create((set) => ({
  // Start collapsed on mobile so the drawer doesn't cover content on load.
  // At md+ the sidebar is statically positioned, so this flag is ignored there.
  sidebarOpen: typeof window === 'undefined' || window.innerWidth >= 768,
  loading: false,
  theme: 'light',
  toast: null, // { message, type: 'success' | 'error' | 'info' }

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (isOpen) => set({ sidebarOpen: isOpen }),
  setLoading: (isLoading) => set({ loading: isLoading }),
  setTheme: (theme) => set({ theme }),
  
  showToast: (message, type = 'success') => {
    set({ toast: { message, type } });
    // Auto-clear after 4 seconds
    setTimeout(() => {
      set({ toast: null });
    }, 4000);
  },
  
  clearToast: () => set({ toast: null }),
}));
