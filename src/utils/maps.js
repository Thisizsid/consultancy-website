/**
 * Builds the "where is this place" link used by branch cards and the contact
 * page.
 *
 * Deliberately a plain link rather than an embedded map: an embed needs a
 * Google Maps API key tied to a billing account, is another third-party
 * resource that can fail to load, and sets cookies. A link needs none of
 * that, and on mobile it hands off to the native Maps app with directions
 * ready — which is how most people actually use it.
 */

/**
 * A branch may carry an explicit `mapUrl` (the admin pasted a share link and
 * therefore picked the exact pin). When it doesn't — which is every branch
 * saved before the field existed — fall back to a Maps search built from the
 * address we already store, so the link works with no data migration.
 *
 * Returns null when there's nothing to point at, so callers can hide the
 * control instead of rendering a link to nowhere.
 */
export const mapLinkFor = ({ mapUrl, address, city } = {}) => {
  if (mapUrl) return mapUrl;

  const query = [address, city].filter(Boolean).join(', ').trim();
  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};

export default mapLinkFor;
