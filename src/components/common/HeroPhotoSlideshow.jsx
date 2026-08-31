import React, { useEffect, useState } from 'react';

/**
 * Auto-advancing crossfade photo backdrop, matching the homepage hero's
 * slide behavior (see src/pages/Home/index.jsx) but stripped of its
 * per-slide text/CTA content — just the rotating photos, meant to sit
 * behind a caller-supplied static overlay and heading.
 */
const HeroPhotoSlideshow = ({ images, intervalMs = 6000, imgClassName = '' }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [images.length, intervalMs]);

  // Guards against a stale index if the image set shrinks between renders
  // (e.g. the admin deactivates hero slides while this is mounted).
  useEffect(() => {
    setIndex((prev) => (prev >= images.length ? 0 : prev));
  }, [images.length]);

  return (
    <div className="absolute inset-0 w-full h-full">
      {images.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img src={src} alt="" className={`w-full h-full object-cover ${imgClassName}`} />
        </div>
      ))}
    </div>
  );
};

export default HeroPhotoSlideshow;
