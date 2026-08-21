// Must come first: populates process.env before any other module is evaluated.
import './config/env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDb } from './config/db.js';
import authRoutes from './routes/auth.js';
import uploadRoutes from './routes/upload.js';
import crudRoutes from './routes/crud.js';
import { generalLimiter } from './middleware/rateLimit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// Behind Nginx/Apache the client IP arrives in X-Forwarded-For. Without this,
// express-rate-limit would see the proxy's IP and throttle every user as one.
app.set('trust proxy', 1);

// Security headers. crossOriginResourcePolicy is relaxed because /uploads
// intentionally serves public images to the frontend, which may be a
// different origin (e.g. localhost:5173 in development).
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression());

const allowedOrigins = [
  'https://www.lassoconsultancy.com.np',
  'https://lassoconsultancy.com.np',
  // Vite dev server — development only, never trusted in production
  ...(isProd ? [] : ['http://localhost:5173', 'http://localhost:4173']),
];

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin / non-browser clients (curl, health checks) which send no Origin
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // Tag with a status so the error handler returns 403, not a generic 500
    const err = new Error(`Origin not allowed by CORS: ${origin}`);
    err.status = 403;
    return cb(err);
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Broad backstop against request floods; per-route limiters are stricter.
app.use('/api', generalLimiter);

// Serve static uploaded files
const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '7d',
  // Never let a stored file be interpreted as something executable
  setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

// Initialize Database
initDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/collections', crudRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Consultancy Website Node Server Running' });
});

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.originalUrl}` });
});

// Central error handler — keeps internals out of client responses in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  res.status(status).json({
    error: isProd && status === 500 ? 'Internal server error' : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Node.js Express server running on http://localhost:${PORT}`);
  console.log(`   env: ${isProd ? 'production' : 'development'}`);
});
