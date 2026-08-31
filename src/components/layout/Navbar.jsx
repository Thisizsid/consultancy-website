import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Menu, X, LayoutDashboard, ChevronDown, MapPin, Globe2,
  Compass, School, FileText, CheckSquare, Edit3, Award,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { getAllDocuments } from '../../services/api';
import Button from '../ui/Button';
import NavDropdown from './NavDropdown';
import logo from '../../assets/logo.png';
import { documentSlug } from '../../utils/slug';

// Mirrors the icon field stored on each service document (see ServicesCMS),
// so the dropdown can show the same icon used on the Services page instead
// of a generic placeholder.
const SERVICE_ICON_MAP = { Compass, School, FileText, CheckSquare, Edit3, Award };

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [dropdownData, setDropdownData] = useState({ countries: [], services: [], branches: [] });
  const [dropdownLoading, setDropdownLoading] = useState(true);
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

  // Close mobile menu and any open dropdown on route change — a dropdown
  // opened by tap (touch devices) has no mouseleave to close it otherwise.
  useEffect(() => {
    setIsOpen(false);
    setMobileExpanded(null);
    setOpenMenu(null);
  }, [location]);

  // Load dropdown data once (used across every page the navbar renders on)
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [countries, services, branches] = await Promise.all([
          getAllDocuments('countries').catch(() => []),
          getAllDocuments('services').catch(() => []),
          getAllDocuments('branches').catch(() => []),
        ]);
        setDropdownData({
          countries: countries.filter((c) => c.visible !== false),
          services,
          branches: branches.filter((b) => b.status === 'active'),
        });
      } catch (error) {
        console.error('Error fetching nav dropdown data:', error);
      } finally {
        setDropdownLoading(false);
      }
    };
    fetchDropdownData();
  }, []);

  const dropdownConfig = {
    countries: {
      label: 'Countries',
      basePath: '/countries',
      columns: dropdownData.countries.length > 4 ? 2 : 1,
      items: dropdownData.countries.map((c) => ({
        key: c.id,
        label: c.name,
        icon: Globe2,
        path: `/countries/${c.slug}`,
      })),
    },
    services: {
      label: 'Services',
      basePath: '/services',
      columns: 1,
      items: dropdownData.services.map((s, idx) => ({
        key: s.id || idx,
        label: s.title,
        icon: SERVICE_ICON_MAP[s.icon] || Compass,
        path: `/services/${documentSlug(s)}`,
      })),
    },
    branches: {
      label: 'Branches',
      basePath: '/branches',
      columns: 1,
      items: dropdownData.branches.map((b, idx) => ({
        key: b.id || idx,
        label: b.name,
        icon: MapPin,
        path: `/branches/${b.id || idx}`,
      })),
    },
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Countries', path: '/countries', dropdown: 'countries' },
    { name: 'Services', path: '/services', dropdown: 'services' },
    { name: 'Events', path: '/events' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Branches', path: '/branches', dropdown: 'branches' },
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
            {navLinks.map((link) => {
              if (link.dropdown) {
                const config = dropdownConfig[link.dropdown];
                return (
                  <NavDropdown
                    key={link.name}
                    label={config.label}
                    columns={config.columns}
                    isOpen={openMenu === link.dropdown}
                    onOpen={() => setOpenMenu(link.dropdown)}
                    onClose={() => setOpenMenu((prev) => (prev === link.dropdown ? null : prev))}
                    items={config.items}
                    loading={dropdownLoading}
                    showDarkBackground={showDarkBackground}
                    isActiveGroup={location.pathname.startsWith(config.basePath)}
                  />
                );
              }
              return (
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
              );
            })}
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
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-6 space-y-1 shadow-md animate-in slide-in-from-top-5 duration-200">
          {navLinks.map((link) => {
            if (link.dropdown) {
              const config = dropdownConfig[link.dropdown];
              const expanded = mobileExpanded === link.dropdown;
              return (
                <div key={link.name} className="border-b border-gray-100 last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setMobileExpanded(expanded ? null : link.dropdown)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-semibold transition-colors ${location.pathname.startsWith(config.basePath) ? 'text-secondary' : 'text-text-primary hover:bg-gray-50'
                      }`}
                    aria-expanded={expanded}
                  >
                    <span>{link.name}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-out ${expanded ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                  >
                    <div className="overflow-y-auto max-h-72 pl-3 pb-2 space-y-0.5">
                      <NavLink
                        to={link.path}
                        className="block px-3 py-2 rounded-md text-sm font-semibold text-secondary hover:bg-blue-50"
                      >
                        View all {link.name.toLowerCase()}
                      </NavLink>
                      {config.items.map((item) => (
                        <Link
                          key={item.key}
                          to={item.path}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-gray-50 group"
                        >
                          <div className="w-6 h-6 rounded bg-surface text-text-primary flex items-center justify-center shrink-0">
                            {item.icon ? (
                              <item.icon className="w-3.5 h-3.5" />
                            ) : (
                              <span className="text-[9px] font-extrabold">{item.badge}</span>
                            )}
                          </div>
                          <span className="text-sm text-text-secondary group-hover:text-secondary truncate">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) => `
                  block px-3 py-3 rounded-md text-base font-semibold transition-colors
                  ${isActive ? 'bg-secondary/10 text-secondary' : 'text-text-primary hover:bg-gray-50'}
                `}
              >
                {link.name}
              </NavLink>
            );
          })}
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
