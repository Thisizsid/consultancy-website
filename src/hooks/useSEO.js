import { useEffect } from 'react';

const SITE_NAME = "Lasso Int'l Education Consultancy";
const SITE_URL = 'https://lassoconsultancy.com';
const DEFAULT_DESCRIPTION =
  "Lasso Consultancy helps students gain admission and visa approval for top study-abroad destinations, with expert counseling, application support, and visa guidance.";
const DEFAULT_IMAGE = '/logo.png';

const setMeta = (attr, key, content) => {
  if (!content) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setCanonical = (href) => {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * Sets per-route title, meta description, canonical URL, and Open
 * Graph/Twitter tags. This runs client-side (useEffect), so it's picked up
 * by Google (which renders JS) and by the browser tab/history — but NOT by
 * crawlers or social-preview scrapers that only fetch the raw index.html
 * (most of them). Fixing that would need server-side injection of these
 * tags per route, which is a larger change than this pass covers; the
 * static defaults in index.html are what those scrapers see today.
 *
 * `path` is the route's pathname (e.g. `/countries/canada`), used to build
 * the canonical/OG URL — pass it explicitly rather than reading
 * `location.pathname` here so this hook has no router dependency.
 */
export function useSEO({ title, description = DEFAULT_DESCRIPTION, path = '/', image = DEFAULT_IMAGE } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    const canonicalUrl = `${SITE_URL}${path}`;
    const imageUrl = image.startsWith('http') ? image : `${SITE_URL}${image}`;

    document.title = fullTitle;
    setMeta('name', 'description', description);
    setCanonical(canonicalUrl);

    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', imageUrl);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', SITE_NAME);

    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', imageUrl);
  }, [title, description, path, image]);
}
