import { useEffect, useState } from 'react';
import { getAllDocuments } from '../services/api';

// The same three fallback photos used as the homepage hero's default slides
// (see src/pages/Home/index.jsx) — kept in sync here so pages that echo
// "the homepage hero" show the identical slideshow instead of re-fetching
// and re-declaring the same three URLs.
export const DEFAULT_HERO_IMAGES = [
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&auto=format&fit=crop&q=80',
];

/**
 * Resolves to the same photo set the homepage hero slides through: active
 * CMS hero slide images sorted by order, or the same three default photos
 * Home falls back to when the admin hasn't added any hero slides yet.
 */
export const useHeroImages = () => {
  const [images, setImages] = useState(DEFAULT_HERO_IMAGES);

  useEffect(() => {
    let cancelled = false;
    const fetchImages = async () => {
      try {
        const hero = await getAllDocuments('hero');
        const active = hero
          .filter((s) => s.status === 'active' && s.image)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((s) => s.image);
        if (!cancelled && active.length > 0) {
          setImages(active);
        }
      } catch {
        // Keep the default fallback set — a failed fetch here shouldn't
        // block the page it's decorating.
      }
    };
    fetchImages();
    return () => {
      cancelled = true;
    };
  }, []);

  return images;
};
