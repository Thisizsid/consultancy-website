import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// The admin JWT is a flat 24h token with no sliding expiry (see
// server/middleware/auth.js) — left alone, an admin panel tab stays a live
// session for up to a full day regardless of activity. This closes that gap
// client-side: sign out after this long with no interaction.
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

/**
 * Call once from a component rendered for every authenticated admin route
 * (AdminLayout). Resets a 30-minute timer on any user interaction; when it
 * elapses, logs the admin out (revoking the token server-side, same as a
 * manual logout) and redirects to the login page.
 */
export const useIdleLogout = () => {
  const { isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const handleIdle = () => {
      // AdminLayout (the only place the toast UI renders) unmounts as part
      // of this redirect, so a toast call here would never be seen — pass
      // the reason through router state instead, for Login to display.
      logout().finally(() => {
        navigate('/admin/login', { replace: true, state: { idleLogout: true } });
      });
    };

    const resetTimer = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(handleIdle, IDLE_TIMEOUT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer));

    return () => {
      clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
    };
  }, [isAuthenticated, logout, navigate]);
};
