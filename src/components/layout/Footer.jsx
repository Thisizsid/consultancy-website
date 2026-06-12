import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Mail, Phone, MapPin, Clock } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-white border-t border-gray-800">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
          
          {/* Logo & Tagline */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-secondary text-white p-2 rounded-md">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">LASSO</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              "Connecting Students to Global Opportunities"
            </p>
            <p className="text-gray-400 text-xs leading-relaxed">
              Lasso Consultancy is a premier study abroad counseling platform helping students gain admission and visa approvals for top global education hubs.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/countries" className="hover:text-white transition-colors">Explore Countries</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Our Services</Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">Seminars & Workshops</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Get in Touch</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-5">Contact Us</h4>
            <ul className="space-y-3.5 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <span>102 Premium Plaza, Parliament Road, Kathmandu, Nepal</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-accent shrink-0" />
                <span>+977 1-4433221</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-accent shrink-0" />
                <span>info@lassoconsultancy.com</span>
              </li>
            </ul>
          </div>

          {/* Office Hours */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-5">Office Hours</h4>
            <ul className="space-y-3.5 text-sm text-gray-400">
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Sunday - Friday</p>
                  <p className="text-xs text-gray-400">9:00 AM - 6:00 PM</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-500">Saturday</p>
                  <p className="text-xs text-gray-500">Closed</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {currentYear} Lasso Consultancy. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/admin/login" className="hover:text-white transition-colors">Admin Console</Link>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
