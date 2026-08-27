import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation, Outlet, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Globe,
  Briefcase,
  Calendar,
  MessageSquare,
  Building,
  LogOut,
  Menu,
  X,
  Eye,
  Inbox,
  GitBranch,
  ImageIcon,
  KeyRound,
  Presentation,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import Button from '../../components/ui/Button';
import logo from '../../assets/logo.png';
import ChangePasswordModal from '../components/ChangePasswordModal';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar, setSidebarOpen, toast, clearToast } = useUiStore();
  const [pwModalOpen, setPwModalOpen] = useState(false);

  // Collapse the mobile drawer after navigating so it doesn't cover the new page
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Loading and auth guard now handled by ProtectedRoute — render layout directly

  const links = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Enquiries', path: '/admin/enquiries', icon: Inbox },
    { name: 'Homepage Hero', path: '/admin/hero', icon: Presentation },
    { name: 'Countries CMS', path: '/admin/countries', icon: Globe },
    { name: 'Services CMS', path: '/admin/services', icon: Briefcase },
    { name: 'Events CMS', path: '/admin/events', icon: Calendar },
    { name: 'Testimonials CMS', path: '/admin/testimonials', icon: MessageSquare },
    { name: 'Partners CMS', path: '/admin/partners', icon: Building },
    { name: 'Branches', path: '/admin/branches', icon: GitBranch },
    { name: 'Gallery CMS', path: '/admin/gallery', icon: ImageIcon },
    { name: 'Site Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile drawer backdrop — tap outside to dismiss */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-primary/50 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-primary text-white flex flex-col justify-between 
          transform transition-transform duration-300 md:relative md:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-white p-1 rounded-full shadow-sm shrink-0">
                <img
                  src={logo}
                  alt="Lasso logo"
                  className="h-7 w-7 object-contain"
                />
              </div>
              <span className="font-extrabold text-lg tracking-wider">LASSO CMS</span>
            </Link>
            <button className="md:hidden p-1 text-gray-400 hover:text-white" onClick={toggleSidebar}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation links */}
          <nav className="px-4 py-6 space-y-1.5">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-md text-sm font-semibold transition-all duration-200
                    ${isActive
                      ? 'bg-secondary text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{link.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold uppercase">
              {user?.email?.charAt(0) || 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.email}</p>
              <p className="text-[10px] text-gray-400">Administrator</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full text-xs py-2 mb-2 border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            icon={KeyRound}
            onClick={() => setPwModalOpen(true)}
          >
            Change Password
          </Button>
          <Button
            variant="danger"
            className="w-full text-xs py-2"
            icon={LogOut}
            onClick={handleLogout}
          >
            Log Out
          </Button>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Console */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="p-1 rounded-md text-text-secondary hover:bg-gray-100 md:hidden"
              onClick={toggleSidebar}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base font-bold text-text-primary hidden md:block">
              Study Abroad Operations Console
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <a href="/" target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" icon={Eye}>
                View Public Site
              </Button>
            </a>
          </div>
        </header>

        {/* Dynamic Nested View Outlet */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ChangePasswordModal isOpen={pwModalOpen} onClose={() => setPwModalOpen(false)} />

      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-4 left-4 md:left-auto md:right-5 z-50 animate-in slide-in-from-bottom-5">
          <div
            className={`
              px-5 py-3 rounded-md shadow-md border text-sm font-semibold flex items-center gap-3
              ${toast.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : ''}
              ${toast.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : ''}
              ${toast.type === 'info' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
            `}
          >
            <span>{toast.message}</span>
            <button onClick={clearToast} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
