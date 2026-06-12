import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Public Layout & Pages
import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/Home';
import Countries from './pages/Countries';
import CountryDetail from './pages/CountryDetail';
import Services from './pages/Services';
import Events from './pages/Events';
import Contact from './pages/Contact';

// Admin Layout & Pages
import AdminLayout from './admin/layout/AdminLayout';
import Login from './admin/pages/Login';
import Dashboard from './admin/pages/Dashboard';
import CountriesCMS from './admin/pages/CountriesCMS';
import ServicesCMS from './admin/pages/ServicesCMS';
import EventsCMS from './admin/pages/EventsCMS';
import TestimonialsCMS from './admin/pages/TestimonialsCMS';
import PartnersCMS from './admin/pages/PartnersCMS';
import EnquiriesCMS from './admin/pages/EnquiriesCMS';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const { initAuthListener } = useAuthStore();

  // Initialize auth listeners immediately on load
  useEffect(() => {
    const unsubscribe = initAuthListener();
    return () => unsubscribe();
  }, [initAuthListener]);

  return (
    <Router>
      <Routes>
        
        {/* Public Website Routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="countries" element={<Countries />} />
          <Route path="countries/:slug" element={<CountryDetail />} />
          <Route path="services" element={<Services />} />
          <Route path="events" element={<Events />} />
          <Route path="contact" element={<Contact />} />
        </Route>

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<Login />} />

        {/* Admin Dashboard Protected Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="countries" element={<CountriesCMS />} />
          <Route path="services" element={<ServicesCMS />} />
          <Route path="events" element={<EventsCMS />} />
          <Route path="testimonials" element={<TestimonialsCMS />} />
          <Route path="partners" element={<PartnersCMS />} />
          <Route path="enquiries" element={<EnquiriesCMS />} />
        </Route>

        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
}

export default App;
