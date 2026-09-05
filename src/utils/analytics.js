// Loads GA4 only when a Measurement ID is configured, so local/dev builds
// (no VITE_GA_MEASUREMENT_ID set) never send data to Google.
export function initAnalytics() {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (!measurementId) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  // send_page_view disabled: App.jsx's router listener sends page_view on
  // every route change instead, since this is an SPA (no full page loads).
  gtag('config', measurementId, { send_page_view: false });
}

export function trackPageView(path) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', { page_path: path });
}
