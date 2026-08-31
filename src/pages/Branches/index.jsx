import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  GitBranch,
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
  Navigation,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getAllDocuments } from '../../services/api';
import { mapLinkFor } from '../../utils/maps';
import Badge from '../../components/ui/Badge';
import { FacebookIcon, InstagramIcon, TiktokIcon } from '../../components/icons/SocialIcons';

/** Per-branch office photos, in a fixed display order. */
const photosFor = (branch) => [branch.photo1, branch.photo2].filter(Boolean);

/** Per-branch social profiles, in a fixed display order. */
const socialItemsFor = (branch) =>
  [
    { key: 'facebook', url: branch.facebook, Icon: FacebookIcon, label: 'Facebook' },
    { key: 'instagram', url: branch.instagram, Icon: InstagramIcon, label: 'Instagram' },
    { key: 'tiktok', url: branch.tiktok, Icon: TiktokIcon, label: 'TikTok' },
  ].filter((item) => item.url);

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [lightbox, setLightbox] = useState({ open: false, branchName: '', photos: [], index: 0 });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const data = await getAllDocuments('branches');
        setBranches(data.filter((b) => b.status === 'active'));
      } catch (err) {
        console.error('Error fetching branches:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  // Scroll to a specific branch card when arriving via a dropdown link (#branchId)
  useEffect(() => {
    if (!loading && location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [loading, location.hash]);

  const openLightbox = (branch, index) => {
    setLightbox({ open: true, branchName: branch.name, photos: photosFor(branch), index });
  };

  const closeLightbox = useCallback(() => {
    setLightbox((prev) => ({ ...prev, open: false }));
  }, []);

  const goToPrev = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index - 1 + prev.photos.length) % prev.photos.length,
    }));
  }, []);

  const goToNext = useCallback(() => {
    setLightbox((prev) => ({
      ...prev,
      index: (prev.index + 1) % prev.photos.length,
    }));
  }, []);

  // Keyboard navigation for the lightbox
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

  return (
    <div className="overflow-hidden">
      {/* PAGE HERO */}
      <section className="relative bg-gradient-to-br from-primary via-primary-light to-accent text-white pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-2xl space-y-4">
            <Badge variant="accent">OUR LOCATIONS</Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Find a Branch Near You
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed">
              Visit any of our conveniently located offices and speak directly
              with our expert education counselors.
            </p>
          </div>
        </div>
      </section>

      {/* BRANCHES GRID */}
      <section className="py-20 md:py-24 bg-surface">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center py-16">
              <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : branches.length === 0 ? (
            <div className="text-center py-24 space-y-4">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto" />
              <h3 className="text-xl font-bold text-text-primary">No branches available yet</h3>
              <p className="text-text-secondary">Please check back later or contact us directly.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  id={branch.id}
                  className="group bg-white border border-gray-150 rounded-xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all duration-300 scroll-mt-28"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                        <GitBranch className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <h2 className="font-bold text-text-primary text-base leading-snug">
                          {branch.name}
                        </h2>
                        <p className="text-xs text-secondary font-semibold mt-0.5">{branch.city}</p>
                      </div>
                    </div>
                    {photosFor(branch).length > 0 && (
                      <button
                        onClick={() => openLightbox(branch, 0)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold hover:bg-secondary hover:text-white focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors"
                      >
                        <Images className="w-3.5 h-3.5" />
                        View Photos
                      </button>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gray-100" />

                  {/* Contact Details */}
                  <div className="space-y-3 text-sm text-text-secondary">
                    {branch.address && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{branch.address}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-secondary shrink-0" />
                        <a
                          href={`tel:${branch.phone}`}
                          className="hover:text-secondary transition-colors font-medium"
                        >
                          {branch.phone}
                        </a>
                      </div>
                    )}
                    {branch.email && (
                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-secondary shrink-0" />
                        <a
                          href={`mailto:${branch.email}`}
                          className="hover:text-secondary transition-colors truncate font-medium"
                        >
                          {branch.email}
                        </a>
                      </div>
                    )}
                    {branch.openingHours && (
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-accent shrink-0" />
                        <span>{branch.openingHours}</span>
                      </div>
                    )}
                  </div>

                  {socialItemsFor(branch).length > 0 && (
                    <div className="flex items-center gap-2">
                      {socialItemsFor(branch).map(({ key, url, Icon, label }) => (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${branch.name} on ${label}`}
                          title={label}
                          className="w-9 h-9 rounded-full bg-secondary/10 text-secondary hover:bg-secondary hover:text-white focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 flex items-center justify-center transition-colors"
                        >
                          <Icon className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Pushed to the card's base so buttons line up across a row
                      of cards whose contact details differ in length. */}
                  {mapLinkFor(branch) && (
                    <a
                      href={mapLinkFor(branch)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-secondary/30 bg-secondary/5 text-secondary text-sm font-bold hover:bg-secondary hover:text-white focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors"
                    >
                      <Navigation className="w-4 h-4 shrink-0" />
                      Get Directions
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Photo Lightbox */}
      {lightbox.open && lightbox.photos.length > 0 && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-5 right-5 z-10 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="absolute top-5 left-5 z-10 px-4 py-2 rounded-full bg-white/10 text-white/80 text-xs font-semibold">
            {lightbox.branchName} — {lightbox.index + 1} / {lightbox.photos.length}
          </div>

          {lightbox.photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {lightbox.photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div
            className="flex items-center justify-center max-w-[90vw] max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.photos[lightbox.index]}
              alt={`${lightbox.branchName} office ${lightbox.index + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
