// Must come first: populates process.env before any other module is evaluated.
import './config/env.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
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

// Behind the production Nginx config (see DEPLOYMENT.md), X-Forwarded-For is
// set via `$proxy_add_x_forwarded_for`, which *appends* the real client IP
// rather than trusting whatever the client sent — so with `trust proxy: 1`,
// Express correctly reads that right-most, proxy-supplied hop.
//
// Only enable this in production. With no reverse proxy in front (local dev,
// or the port hit directly), trusting X-Forwarded-For lets any client set it
// to an arbitrary value and rotate it per request to bypass IP-based rate
// limiting (login brute-force, enquiry flooding) entirely — Express would
// otherwise fall back to the real, non-spoofable socket address.
if (isProd) {
  app.set('trust proxy', 1);
}

// Security headers. crossOriginResourcePolicy is relaxed because /uploads
// intentionally serves public images to the frontend, which may be a
// different origin (e.g. localhost:5173 in development).
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(compression());

// Derived from FRONTEND_URL (already required in production — see
// config/env.js) instead of a hardcoded domain, so pointing the site at a
// new domain is a config change, not a code change. ALLOWED_ORIGINS adds
// any extra origins (e.g. both the apex and www) as a comma-separated list.
const extraOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ...extraOrigins,
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
// Reads the httpOnly admin_token cookie into req.cookies for verifyTokenMiddleware.
app.use(cookieParser());

// Broad backstop against request floods; per-route limiters are stricter.
app.use('/api', generalLimiter);

// Serve static uploaded files. Same DATA_DIR convention as
// config/db.js / routes/upload.js — must point at the same directory those
// write to, or newly uploaded files 404 until the next redeploy.
const uploadsPath = path.join(process.env.DATA_DIR || __dirname, 'uploads');
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

// Single-service deployment: this process also serves the built frontend
// (dist/), so one Railway/VPS service covers both the API and the site —
// no separate static host, no path-based routing to configure. Skipped
// harmlessly if dist/ doesn't exist (e.g. running `npm run server` locally
// without building first — the Vite dev server serves the frontend then).
const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: isProd ? '1d' : 0 }));
  // SPA fallback: any GET that isn't a real static file or an API/uploads
  // route is a client-side route (e.g. /countries/canada) — let React
  // Router handle it by serving index.html.
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

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
