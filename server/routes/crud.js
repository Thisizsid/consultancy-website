import express from 'express';
import { getDb } from '../config/db.js';
import { verifyTokenMiddleware } from '../middleware/auth.js';
import { enquiryLimiter } from '../middleware/rateLimit.js';
import { getCreateSchema, getUpdateSchema, formatZodError } from '../schemas/collections.js';

const router = express.Router();

const VALID_COLLECTIONS = [
  'countries',
  'services',
  'testimonials',
  'events',
  'partners',
  'branches',
  'enquiries',
  'gallery',
  'settings'
];

const validateCollection = (req, res, next) => {
  const col = req.params.collection;
  if (!VALID_COLLECTIONS.includes(col)) {
    return res.status(400).json({ error: `Invalid collection: ${col}` });
  }
  next();
};

// Collections whose contents are private (contain visitor PII, internal
// notes, etc.) rather than public marketing content. Reads require the same
// admin JWT that writes already do.
const PRIVATE_READ_COLLECTIONS = new Set(['enquiries']);

const conditionalReadAuth = (req, res, next) => {
  if (PRIVATE_READ_COLLECTIONS.has(req.params.collection)) {
    return verifyTokenMiddleware(req, res, next);
  }
  next();
};

/**
 * Validates req.body against the per-collection Zod schema before the
 * handler ever touches it. `.strict()` schemas reject unrecognized keys, so
 * this is also what stops a caller from writing arbitrary extra fields.
 * A collection with no schema defined passes through unvalidated.
 * On success, req.body is replaced with the parsed (typed/coerced) value.
 */
const validateBody = (kind) => (req, res, next) => {
  const schema = kind === 'create'
    ? getCreateSchema(req.params.collection)
    : getUpdateSchema(req.params.collection);

  if (!schema) return next();

  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: formatZodError(result.error),
    });
  }

  req.body = result.data;
  next();
};

/**
 * GET /api/collections/:collection
 * Public for marketing collections (countries, services, ...); admin-only
 * for PRIVATE_READ_COLLECTIONS (enquiries) since they hold visitor PII.
 */
router.get('/:collection', validateCollection, conditionalReadAuth, (req, res) => {
  const col = req.params.collection;
  const db = getDb();

  db.all(`SELECT id, data FROM ${col}`, [], (err, rows) => {
    if (err) {
      console.error(`Error fetching collection ${col}:`, err);
      return res.status(500).json({ error: err.message });
    }

    const items = rows.map((row) => {
      try {
        const parsed = JSON.parse(row.data);
        return { id: row.id, ...parsed };
      } catch {
        return { id: row.id };
      }
    });

    return res.json(items);
  });
});

/**
 * Mirror of the client-side slugify in src/utils/slug.js. Used only as a
 * fallback below, for documents stored before their collection gained a
 * `slug` field — their URLs are derived from the title/name instead, so
 * existing rows keep resolving without a data migration.
 */
const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/**
 * GET /api/collections/:collection/slug/:slug
 *
 * Declared before the `/:collection/:id` route below so a 3-segment request
 * like /collections/services/slug/visa-guidance is matched here rather than
 * being read as the id "slug".
 */
router.get('/:collection/slug/:slug', validateCollection, conditionalReadAuth, (req, res) => {
  const { collection: col, slug } = req.params;
  const db = getDb();

  db.all(`SELECT id, data FROM ${col}`, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    for (const row of rows) {
      try {
        const parsed = JSON.parse(row.data);
        const rowSlug = parsed.slug || slugify(parsed.title || parsed.name);
        if (rowSlug === slug) {
          return res.json({ id: row.id, ...parsed });
        }
      } catch { /* ignore malformed row */ }
    }

    return res.status(404).json({ error: `No document with slug '${slug}' in ${col}` });
  });
});

/**
 * GET /api/collections/:collection/:id
 */
router.get('/:collection/:id', validateCollection, conditionalReadAuth, (req, res) => {
  const { collection: col, id } = req.params;
  const db = getDb();

  db.get(`SELECT id, data FROM ${col} WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: `Document ${id} not found in ${col}` });
    }

    try {
      const parsed = JSON.parse(row.data);
      return res.json({ id: row.id, ...parsed });
    } catch {
      return res.json({ id: row.id });
    }
  });
});

/**
 * POST /api/collections/:collection
 * enquiries are public (contact form), all others require admin auth
 */
const conditionalAuth = (req, res, next) => {
  // Public contact form: no token, but rate limited to prevent lead flooding
  if (req.params.collection === 'enquiries') return enquiryLimiter(req, res, next);
  return verifyTokenMiddleware(req, res, next);
};
router.post('/:collection', validateCollection, conditionalAuth, validateBody('create'), (req, res) => {
  const col = req.params.collection;
  const data = req.body;
  const db = getDb();

  // Enquiries are the one publicly-writable collection. The schema accepts
  // status/createdAt/notes because the current frontend always sends them,
  // but their values are never trusted from the request — a caller must not
  // be able to backdate a lead or pre-set its status via this endpoint.
  if (col === 'enquiries') {
    data.status = 'new';
    data.createdAt = new Date().toISOString();
    data.notes = '';
  }

  const id = data.id || `${col}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const itemToSave = { ...data, id };
  const dataStr = JSON.stringify(itemToSave);

  db.run(`INSERT INTO ${col} (id, data) VALUES (?, ?)`, [id, dataStr], function (err) {
    if (err) {
      console.error(`Error inserting into ${col}:`, err);
      return res.status(500).json({ error: err.message });
    }
    return res.status(201).json(itemToSave);
  });
});

/**
 * PUT /api/collections/:collection/:id
 */
router.put('/:collection/:id', validateCollection, verifyTokenMiddleware, validateBody('update'), (req, res) => {
  const { collection: col, id } = req.params;
  const updateData = req.body;
  const db = getDb();

  db.get(`SELECT id, data FROM ${col} WHERE id = ?`, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let existing = {};
    if (row) {
      try { existing = JSON.parse(row.data); } catch { /* ignore malformed row */ }
    }

    const merged = { ...existing, ...updateData, id };
    const dataStr = JSON.stringify(merged);

    if (row) {
      db.run(`UPDATE ${col} SET data = ? WHERE id = ?`, [dataStr, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        return res.json(merged);
      });
    } else {
      db.run(`INSERT INTO ${col} (id, data) VALUES (?, ?)`, [id, dataStr], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        return res.json(merged);
      });
    }
  });
});

/**
 * DELETE /api/collections/:collection/:id
 */
router.delete('/:collection/:id', validateCollection, verifyTokenMiddleware, (req, res) => {
  const { collection: col, id } = req.params;
  const db = getDb();

  db.run(`DELETE FROM ${col} WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.json({ success: true, id });
  });
});

export default router;
