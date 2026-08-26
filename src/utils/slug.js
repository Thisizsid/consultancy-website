/**
 * Turns a human title into a URL-safe slug ("Visa Guidance" -> "visa-guidance").
 *
 * Mirrored server-side in server/routes/crud.js. Two callers:
 *  - the admin CMS, which stores a real `slug` on each document, and
 *  - the public pages, which fall back to slugify(title) for documents saved
 *    before their collection had a slug field, so old rows still link.
 */
export const slugify = (value = '') =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** The slug a document should be reachable at, stored or derived. */
export const documentSlug = (doc = {}) => doc.slug || slugify(doc.title || doc.name);

export default slugify;
