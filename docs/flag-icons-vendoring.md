Static, unprocessed copy of the `flag-icons` npm package's CSS + SVGs
(https://github.com/lipis/flag-icons). Loaded via a plain <link> tag in
index.html rather than imported into the JS/CSS bundle, so Vite doesn't
inline every flag as base64 and bloat the app bundle — the browser fetches
only the specific flag SVGs actually rendered on the page.

Pruned to just the country codes offered in
src/components/ui/CountryFlag.jsx (COMMON_COUNTRY_CODES). If you add a new
country code there, copy its SVG here too:

  cp node_modules/flag-icons/flags/4x3/<code>.svg public/vendor/flag-icons/flags/4x3/
  cp node_modules/flag-icons/flags/1x1/<code>.svg public/vendor/flag-icons/flags/1x1/

`xx` is flag-icons' built-in "unknown flag" placeholder, kept for safety.
