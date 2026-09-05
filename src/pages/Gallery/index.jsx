import React, { useEffect, useState, useCallback } from 'react';
import { getAllDocuments } from '../../services/api';
import { ImageIcon, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Badge from '../../components/ui/Badge';
import { useSEO } from '../../hooks/useSEO';

const CATEGORIES = ['All', 'Office', 'Events', 'Students', 'Seminars', 'Other'];

const Gallery = () => {
  useSEO({
    title: 'Gallery',
    description: 'Photos from our offices, student events, and seminars — a look at life at Lasso Consultancy.',
    path: '/gallery',
  });

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightbox, setLightbox] = useState({ open: false, index: 0 });

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const data = await getAllDocuments('gallery');
        // Sort newest first
        const sorted = data.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt) : 0;
          const dateB = b.createdAt ? new Date(b.createdAt) : 0;
          return dateB - dateA;
        });
        setPhotos(sorted);
      } catch (error) {
        console.error('Error fetching gallery:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  const filteredPhotos = activeCategory === 'All'
    ? photos
    : photos.filter(p => p.category === activeCategory);

  // Lightbox handlers
  const openLightbox = (index) => {
    setLightbox({ open: true, index });
  };

  const closeLightbox = useCallback(() => {
    setLightbox({ open: false, index: 0 });
  }, []);

  const goToPrev = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index - 1 + filteredPhotos.length) % filteredPhotos.length,
    }));
  }, [filteredPhotos.length]);

  const goToNext = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + 1) % filteredPhotos.length,
    }));
  }, [filteredPhotos.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightbox.open) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightbox.open, closeLightbox, goToPrev, goToNext]);

  const currentPhoto = filteredPhotos[lightbox.index];

  return (
    <div className="overflow-hidden">
      {/* Hero Header */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-24 bg-gradient-to-br from-primary via-primary-light to-accent text-white overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-wider mb-6">
            <ImageIcon className="w-4 h-4" />
            Photo Gallery
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight mb-4">
            Our Moments
          </h1>
          <p className="text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            A glimpse into our seminars, student sessions, office life, and the journeys we help create every day.
          </p>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-16 md:py-20">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">

          {/* Category Filter Pills */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-12">
            {CATEGORIES.map((cat) => {
              const count = cat === 'All'
                ? photos.length
                : photos.filter(p => p.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`
                    relative px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                    ${activeCategory === cat
                      ? 'bg-secondary text-white shadow-lg shadow-secondary/25 scale-105'
                      : 'bg-gray-100 text-text-secondary hover:bg-gray-200 hover:text-text-primary'
                    }
                  `}
                >
                  {cat}
                  {count > 0 && (
                    <span className={`
                      ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold
                      ${activeCategory === cat
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-200 text-text-secondary'
                      }
                    `}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-20">
              <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : filteredPhotos.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
                <ImageIcon className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">No photos yet</h3>
              <p className="text-sm text-text-secondary">
                {photos.length === 0
                  ? 'Our gallery is being updated. Check back soon!'
                  : `No photos found in the "${activeCategory}" category.`
                }
              </p>
            </div>
          ) : (
            /* Masonry-style Grid */
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {filteredPhotos.map((photo, index) => (
                <div
                  key={photo.id}
                  className="break-inside-avoid group relative rounded-xl overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 bg-white"
                  onClick={() => openLightbox(index)}
                  style={{
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.caption}
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading="lazy"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <p className="text-white text-sm font-semibold leading-snug mb-1.5">
                        {photo.caption}
                      </p>
                      <span className="inline-block px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-[10px] font-bold uppercase tracking-wider">
                        {photo.category}
                      </span>
                    </div>

                    {/* Zoom Icon */}
                    <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-500 delay-100">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightbox.open && currentPhoto && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-5 z-10 px-4 py-2 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
            {lightbox.index + 1} / {filteredPhotos.length}
          </div>

          {/* Previous Button */}
          {filteredPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Next Button */}
          {filteredPhotos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Image + Caption */}
          <div
            className="flex flex-col items-center max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentPhoto.imageUrl}
              alt={currentPhoto.caption}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 text-center max-w-xl">
              <p className="text-white text-base font-semibold">{currentPhoto.caption}</p>
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white/10 text-white/70 text-xs font-bold uppercase tracking-wider">
                {currentPhoto.category}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
