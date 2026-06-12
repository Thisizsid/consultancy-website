import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky header navbar */}
      <Navbar />
      
      {/* Main page content scroll region */}
      <main className="flex-1">
        <Outlet />
      </main>
      
      {/* Footer information section */}
      <Footer />
    </div>
  );
};

export default PublicLayout;
