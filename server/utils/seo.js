import { getDb } from '../config/db.js';

// Mirror of src/utils/slug.js's slugify(). Kept in sync with the same
// fallback crud.js already duplicates for its GET .../slug/:slug route —
// documents saved before their collection had a `slug` field are still
// reachable by a slug derived from their title/name.
const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const documentSlug = (doc = {}) => doc.slug || slugify(doc.title || doc.name);

const fetchCollection = (collection) => new Promise((resolve, reject) => {
  getDb().all(`SELECT id, data FROM ${collection}`, [], (err, rows) => {
    if (err) return reject(err);
    const items = rows.map((row) => {
      try {
        return { id: row.id, ...JSON.parse(row.data) };
      } catch {
        return { id: row.id };
      }
    });
    resolve(items);
  });
});

/**
 * Slugs (or, for id-keyed collections like branches, raw row ids) of every
 * publicly-reachable document in a collection. Used to both build the
 * sitemap and to validate CMS-driven URLs for the 404 check below.
 */
export async function getPublicSlugs(collection) {
  const items = await fetchCollection(collection);
  if (collection === 'branches') {
    return items.map((item) => item.id);
  }
  return items
    .filter((item) => item.visible !== false)
    .map((item) => documentSlug(item));
}

export async function slugExists(collection, slug) {
  const slugs = await getPublicSlugs(collection);
  return slugs.includes(slug);
}
