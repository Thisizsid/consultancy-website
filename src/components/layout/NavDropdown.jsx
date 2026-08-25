import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

/**
 * Desktop nav item with a hover-activated dropdown.
 * Stays open while the cursor travels from the trigger into the panel
 * because the panel is a DOM descendant of the same hoverable wrapper.
 * A short close delay smooths out any accidental micro-exits.
 */
const NavDropdown = ({ label, isOpen, onOpen, onClose, items, loading, showDarkBackground, isActiveGroup }) => {
  const closeTimer = useRef(null);

  const handleEnter = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    onOpen();
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        className={`
          flex items-center gap-1 text-sm font-semibold tracking-wide transition-colors duration-300 hover:text-secondary
          ${isActiveGroup
            ? 'text-secondary font-bold'
            : showDarkBackground
              ? 'text-text-primary'
              : 'text-white/90 hover:text-white'
          }
        `}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {label}
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Invisible bridge to keep hover intent across the gap */}
      <div className="absolute left-0 top-full h-3 w-full" />

      <div
        className={`
          absolute left-1/2 -translate-x-1/2 top-full pt-3 w-72 z-50
          transition-all duration-200 ease-out origin-top
          ${isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
          }
        `}
      >
        <div className="bg-white rounded-lg shadow-xl border border-gray-150 overflow-hidden max-h-80 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-6 text-center text-sm text-text-secondary">Loading...</div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-text-secondary">No entries available</div>
          ) : (
            <div className="py-2">
              {items.map((item) => (
                <Link
                  key={item.key}
                  to={item.path}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-blue-50 hover:text-secondary transition-colors duration-150"
                >
                  {item.icon && <item.icon className="w-4 h-4 text-secondary shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavDropdown;
