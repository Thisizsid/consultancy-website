import { useEffect, useState } from 'react';
import { getAllDocuments } from '../services/api';

// Mirrors the first default slide on the homepage hero (see
// src/pages/Home/index.jsx) — kept in sync here so pages that want to echo
// "the homepage hero photo" show the same image without re-fetching all
// three homepage defaults just for the one that's currently first.
export const DEFAULT_HERO_IMAGE =
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&auto=format&fit=crop&q=80';

/**
 * Resolves to whichever image the homepage hero currently shows first: the
 * lowest-order active CMS slide's photo, or the default fallback once the
 * admin hasn't added any hero slides yet — same precedence Home uses.
 */
export const usePrimaryHeroImage = () => {
  const [image, setImage] = useState(DEFAULT_HERO_IMAGE);

  useEffect(() => {
    let cancelled = false;
    const fetchImage = async () => {
      try {
        const hero = await getAllDocuments('hero');
        const active = hero
          .filter((s) => s.status === 'active' && s.image)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (!cancelled && active.length > 0) {
          setImage(active[0].image);
        }
      } catch {
        // Keep the default fallback — a failed fetch here shouldn't block
        // the page it's decorating.
      }
    };
    fetchImage();
    return () => {
      cancelled = true;
    };
  }, []);

  return image;
};
