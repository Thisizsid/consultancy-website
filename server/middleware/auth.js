import jwt from 'jsonwebtoken';
import { getDb } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast rather than silently signing tokens with a guessable fallback
// secret — anyone who knows it could mint a valid admin JWT.
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not set. Define it in .env before starting the server.'
  );
}

// Shortened from 7d: a stolen token should not stay usable for a week,
// especially given the revocation check below only invalidates it early on
// an explicit logout/password change — outside of that it's still a bearer
// token valid until expiry.
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_MS / 1000 });
};

export const AUTH_COOKIE_NAME = 'admin_token';

// Shared by login (to set the cookie) and logout (to clear it) — clearing a
// cookie requires sending the exact same path/domain/sameSite/secure
// attributes it was set with, or the browser treats it as a different
// cookie and leaves the original in place.
//
// httpOnly: keeps the token out of reach of any JS running on the page —
// the whole point of moving off localStorage, where an XSS bug could just
// read it out directly.
// sameSite: 'lax': the browser withholds the cookie on cross-site
// *requests* (a form POST or fetch from another origin) while still
// sending it on top-level GET navigations. Every state-changing admin
// route here is POST/PUT/DELETE, never GET, so this alone closes the CSRF
// gap a cookie otherwise reopens (unlike a bearer token, cookies attach
// automatically) without needing a separate CSRF token.
// secure: only in production — the deployed site is HTTPS-only, but local
// dev runs the API over plain http.
export const authCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
});

// A second, non-httpOnly "logged in" hint — carries no auth power of its
// own (it's just a flag, never checked by verifyTokenMiddleware) but lets
// the frontend tell at a glance whether it's worth calling /auth/me at all.
// Without it, every page load site-wide — the vast majority of which are
// public visitors, not admins — would need a network round trip just to
// find out there's no session, since JS can no longer read the real
// (httpOnly) cookie to short-circuit that check locally.
export const AUTH_HINT_COOKIE_NAME = 'admin_session';

export const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, { ...authCookieOptions(), maxAge: TOKEN_TTL_MS });
  res.cookie(AUTH_HINT_COOKIE_NAME, '1', {
    ...authCookieOptions(),
    httpOnly: false,
    maxAge: TOKEN_TTL_MS,
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions());
  res.clearCookie(AUTH_HINT_COOKIE_NAME, { ...authCookieOptions(), httpOnly: false });
};

export const verifyTokenMiddleware = (req, res, next) => {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }

  // JWTs are stateless and can't be individually revoked, so instead every
  // token embeds the token_version the account had when it was minted.
  // Password change, password reset, and explicit logout all increment that
  // column — this lookup is what makes those actions actually invalidate
  // outstanding tokens instead of just changing the password on paper while
  // a stolen or lingering token keeps working until it expires.
  const db = getDb();
  db.get(
    `SELECT token_version FROM admin_users WHERE id = ?`,
    [decoded.uid],
    (err, row) => {
      if (err) {
        console.error('Token version lookup failed:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!row || row.token_version !== decoded.tokenVersion) {
        return res.status(401).json({ error: 'Unauthorized: Session has been revoked' });
      }
      req.user = decoded;
      next();
    }
  );
};
