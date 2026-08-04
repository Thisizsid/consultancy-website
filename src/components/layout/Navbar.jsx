import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import Button from '../ui/Button';
import logo from '../../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Countries', path: '/countries' },
    { name: 'Services', path: '/services' },
    { name: 'Events', path: '/events' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Branches', path: '/branches' },
  ];

  const isHomePage = location.pathname === '/';
  const showDarkBackground = scrolled || !isHomePage;

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${showDarkBackground
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-150 py-3'
        : 'bg-transparent py-5'
      }`}>
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="bg-white p-1 rounded-full shadow-xl ring-2 ring-white/90 shrink-0 transition-transform duration-300 group-hover:scale-105">
              <img
                src={logo}
                alt="Lasso Int'l Education Consultancy"
                className="h-16 w-16 md:h-20 md:w-20 object-contain rounded-full"
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className={`text-2xl md:text-3xl font-black tracking-tight transition-colors duration-300 leading-none ${showDarkBackground ? 'text-primary' : 'text-white'
                }`}>LASSO</span>
              <span className="text-[11px] md:text-xs block font-extrabold text-secondary mt-1 tracking-wider uppercase leading-none">
                Int'l Education
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => `
                  text-sm font-semibold tracking-wide transition-colors duration-300 hover:text-secondary
                  ${isActive
                    ? 'text-secondary font-bold border-b-2 border-secondary pb-1'
                    : showDarkBackground
                      ? 'text-text-primary'
                      : 'text-white/90 hover:text-white'
                  }
                `}
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Desktop CTA / Admin Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && (
              <Link to="/admin/dashboard">
                <Button
                  variant="outline"
                  size="sm"
                  icon={LayoutDashboard}
                  className={`transition-colors duration-300 ${!showDarkBackground ? 'text-white border-white hover:bg-white/10' : ''
                    }`}
                >
                  Dashboard
                </Button>
              </Link>
            )}
            <Link to="/contact">
              <Button variant="secondary" size="sm">
                Book Consultation
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 rounded-md transition-colors ${showDarkBackground
                  ? 'text-text-primary hover:bg-gray-100'
                  : 'text-white hover:bg-white/10'
                }`}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-3 shadow-md animate-in slide-in-from-top-5 duration-200">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) => `
                block px-3 py-2 rounded-md text-base font-semibold transition-colors
                ${isActive ? 'bg-secondary/10 text-secondary' : 'text-text-primary hover:bg-gray-50'}
              `}
            >
              {link.name}
            </NavLink>
          ))}
          <div className="pt-4 flex flex-col gap-3 px-3">
            {isAuthenticated && (
              <Link to="/admin/dashboard" className="w-full">
                <Button variant="outline" className="w-full" icon={LayoutDashboard}>
                  Dashboard
                </Button>
              </Link>
            )}
            <Link to="/contact" className="w-full">
              <Button variant="secondary" className="w-full">
                Book Consultation
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
