import { create } from 'zustand';
import { getAllDocuments } from '../firebase/firestore';

export const useDashboardStore = create((set, get) => ({
  stats: {
    countries: 0,
    services: 0,
    events: 0,
    testimonials: 0,
    enquiries: 0,
    newEnquiries: 0,
  },
  loadingStats: false,
  error: null,
  selectedFilters: {
    countryVisibility: 'all',
    eventStatus: 'all',
  },

  setFilter: (key, value) => set((state) => ({
    selectedFilters: {
      ...state.selectedFilters,
      [key]: value
    }
  })),

  fetchStats: async () => {
    set({ loadingStats: true, error: null });
    try {
      const countries = await getAllDocuments('countries');
      const services = await getAllDocuments('services');
      const events = await getAllDocuments('events');
      const testimonials = await getAllDocuments('testimonials');
      const enquiries = await getAllDocuments('enquiries');

      set({
        stats: {
          countries: countries.length,
          services: services.length,
          events: events.length,
          testimonials: testimonials.length,
          enquiries: enquiries.length,
          newEnquiries: enquiries.filter(e => !e.status || e.status === 'new').length,
        },
        loadingStats: false,
      });
    } catch (err) {
      set({ error: err.message, loadingStats: false });
    }
  }
}));
