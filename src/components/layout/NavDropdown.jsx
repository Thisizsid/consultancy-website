import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ArrowRight } from 'lucide-react';

/**
 * Desktop nav item with a hover-activated dropdown.
 *
 * Two ways to open it, both landing on the same isOpen/onOpen/onClose props:
 *  - Hover: the panel is a DOM descendant of the hoverable wrapper, so the
 *    cursor never "leaves" while crossing from trigger to panel. A short
 *    close delay smooths out accidental micro-exits.
 *  - Click/tap: needed on touch devices (e.g. an iPad at this breakpoint)
 *    that can focus a button but never fire mouseenter. A click-outside
 *    listener closes it again since there's no mouseleave to rely on.
 */
const NavDropdown = ({
  label,
  eyebrow,
  isOpen,
  onOpen,
  onClose,
  items,
  loading,
  columns = 1,
  basePath,
  showDarkBackground,
  isActiveGroup,
}) => {
  const closeTimer = useRef(null);
  const wrapperRef = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleEnter = () => {
    clearCloseTimer();
    onOpen();
  };

  const handleLeave = () => {
    closeTimer.current = setTimeout(onClose, 150);
  };

  const handleTriggerClick = () => {
    clearCloseTimer();
    if (isOpen) onClose();
    else onOpen();
  };

  // Touch/click support: with no mouseleave to rely on, tapping anywhere
  // outside the menu is what closes it.
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [isOpen, onClose]);

  const panelWidth = columns === 2 ? 'w-80' : 'w-64';

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        type="button"
        onClick={handleTriggerClick}
        className={`
          flex items-center gap-1 text-sm font-semibold tracking-wide transition-colors duration-200 hover:text-secondary
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
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Invisible bridge — keeps hover intent across the gap to the panel */}
      <div className="absolute left-0 top-full h-2 w-full" />

      <div
        className={`
          absolute left-1/2 -translate-x-1/2 top-full pt-2 ${panelWidth} z-50
          transition-[opacity,transform] duration-150 ease-out origin-top
          ${isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
          }
        `}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-150 overflow-hidden">
          {eyebrow && (
            <div className="px-3.5 py-2 border-b border-gray-100">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-secondary">
                {eyebrow}
              </span>
            </div>
          )}

          {loading ? (
            <div className="px-3.5 py-6 text-center text-xs text-text-secondary">Loading…</div>
          ) : items.length === 0 ? (
            <div className="px-3.5 py-6 text-center text-xs text-text-secondary">Nothing here yet</div>
          ) : (
            <div
              className={`p-1.5 max-h-72 overflow-y-auto ${columns === 2 ? 'grid grid-cols-2 gap-x-1 gap-y-0.5' : 'space-y-0.5'
                }`}
            >
              {items.map((item) => (
                <Link
                  key={item.key}
                  to={item.path}
                  className="group flex items-center gap-2.5 px-2 py-1.5 rounded-md border-l-2 border-transparent hover:border-secondary hover:bg-surface transition-colors duration-150"
                >
                  <div className="w-6 h-6 rounded-md bg-surface border border-gray-100 text-secondary flex items-center justify-center shrink-0">
                    {item.icon ? (
                      <item.icon className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[9px] font-extrabold">{item.badge}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-text-primary group-hover:text-secondary transition-colors truncate leading-snug">
                      {item.label}
                    </p>
                    {item.sub && (
                      <p className="text-[11px] text-text-secondary truncate leading-snug">{item.sub}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {basePath && (
            <Link
              to={basePath}
              className="flex items-center justify-between px-3.5 py-2 border-t border-gray-100 text-[11px] font-bold text-secondary hover:bg-surface transition-colors duration-150"
            >
              View all {label}
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavDropdown;
