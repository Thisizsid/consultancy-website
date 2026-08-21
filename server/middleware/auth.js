import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Fail fast rather than silently signing tokens with a guessable fallback
// secret — anyone who knows it could mint a valid admin JWT.
if (!JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is not set. Define it in .env before starting the server.'
  );
}

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};
