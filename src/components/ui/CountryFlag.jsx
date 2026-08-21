import { Globe2 } from 'lucide-react';

/**
 * Renders a real flag glyph (via the flag-icons package, vendored statically
 * under public/vendor/flag-icons) instead of an emoji flag character. Emoji
 * flags render as plain two-letter text on Windows and inconsistently across
 * platforms — this looks correct everywhere, and each flag's SVG is only
 * fetched over the network when it's actually rendered on the page.
 *
 * `code` is a lowercase or uppercase ISO 3166-1 alpha-2 code (e.g. "CA"),
 * or the pseudo-code "EU" for the European Union. Falls back to a generic
 * globe icon when the code is missing or unrecognized.
 */
const CountryFlag = ({ code, className = '', title }) => {
  if (!code) {
    return <Globe2 className={className} aria-hidden="true" />;
  }

  return (
    <span
      className={`fi fi-${code.toLowerCase()} ${className}`}
      role="img"
      aria-label={title || `${code.toUpperCase()} flag`}
      title={title}
    />
  );
};

export default CountryFlag;
