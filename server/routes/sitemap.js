import express from 'express';
import { getPublicSlugs } from '../utils/seo.js';

const router = express.Router();

// Static, always-crawlable pages. Admin routes are excluded (see
// public/robots.txt) and detail-page routes are generated from the CMS
// below, so this list only needs the top-level public pages.
const STATIC_PATHS = ['/', '/countries', '/services', '/events', '/gallery', '/contact', '/branches'];

router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = (process.env.FRONTEND_URL || 'https://lassoconsultancy.com').replace(/\/$/, '');

    const [countrySlugs, serviceSlugs, branchIds] = await Promise.all([
      getPublicSlugs('countries'),
      getPublicSlugs('services'),
      getPublicSlugs('branches'),
    ]);

    const urls = [
      ...STATIC_PATHS,
      ...countrySlugs.map((slug) => `/countries/${slug}`),
      ...serviceSlugs.map((slug) => `/services/${slug}`),
      ...branchIds.map((id) => `/branches/${id}`),
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((path) => `  <url><loc>${baseUrl}${path}</loc></url>`).join('\n') +
      `\n</urlset>\n`;

    res.type('application/xml').send(body);
  } catch (err) {
    console.error('Error generating sitemap:', err);
    res.status(500).send('Unable to generate sitemap');
  }
});

export default router;
