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
const TOKEN_TTL = '24h';

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL });
};

export const verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
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
