import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  AlertTriangle,
  Images,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getDocument } from '../../services/api';
import { mapLinkFor } from '../../utils/maps';
import { useHeroImages } from '../../hooks/useHeroImages';
import HeroPhotoSlideshow from '../../components/common/HeroPhotoSlideshow';
import Button from '../../components/ui/Button';
import Card, { CardBody } from '../../components/ui/Card';
import { FacebookIcon, InstagramIcon, TiktokIcon } from '../../components/icons/SocialIcons';

const photosFor = (branch) => [branch?.photo1, branch?.photo2].filter(Boolean);

const socialItemsFor = (branch) =>
  [
    { key: 'facebook', url: branch.facebook, Icon: FacebookIcon, label: 'Facebook' },
    { key: 'instagram', url: branch.instagram, Icon: InstagramIcon, label: 'Instagram' },
    { key: 'tiktok', url: branch.tiktok, Icon: TiktokIcon, label: 'TikTok' },
  ].filter((item) => item.url);

const BranchDetail = () => {
  const { id } = useParams();
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const heroImages = useHeroImages();

  useEffect(() => {
    const fetchBranch = async () => {
      setLoading(true);
      try {
        const data = await getDocument('branches', id);
        // Inactive branches aren't listed publicly — don't let a direct
        // link to one leak past that.
        setBranch(data && data.status === 'active' ? data : null);
      } catch (error) {
        console.error('Error loading branch:', error);
        setBranch(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBranch();
  }, [id]);

  const photos = branch ? photosFor(branch) : [];

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goToPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);
  const goToNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;

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
  }, [lightboxIndex, closeLightbox, goToPrev, goToNext]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-secondary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-surface pt-28 pb-20 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-lg shadow-sm border border-gray-150">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold text-primary">Branch Not Found</h2>
          <p className="text-sm text-text-secondary">
            The branch you are looking for does not exist or is no longer active.
          </p>
          <Link to="/branches">
            <Button variant="secondary" className="w-full">
              Back to Branches
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pt-24 pb-20">

      {/* Hero Header Banner — same photo slideshow as the homepage hero,
          matching the Branches list page rather than each branch's own
          office photos (those are in the Office Photos section below). */}
      <div className="relative bg-primary text-white py-16 md:py-24 overflow-hidden">
        <HeroPhotoSlideshow images={heroImages} imgClassName="opacity-20 filter blur-sm" />
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/branches" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-6 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Branches
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{branch.name}</h1>
          <p className="text-gray-300 text-lg mt-4 max-w-3xl leading-relaxed flex items-center gap-2">
            <MapPin className="w-5 h-5 shrink-0" /> {branch.city}
          </p>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column - Photos & Details */}
          <div className="lg:col-span-8 space-y-8">

            {/* Photos */}
            <Card className="bg-white border border-gray-150">
              <CardBody className="p-6 md:p-8 space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                      <Images className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-primary">Office Photos</h3>
                  </div>
                  {photos.length > 0 && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                      {photos.length} {photos.length === 1 ? 'Photo' : 'Photos'}
                    </span>
                  )}
                </div>
                <div className="h-px bg-gray-100" />
                {photos.length > 0 ? (
                  <div className={`grid gap-3 h-80 ${photos.length > 1 ? 'grid-cols-3' : 'grid-cols-1'}`}>
                    {photos.map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        className={`group relative rounded-lg overflow-hidden border border-gray-150 focus:outline-none focus:ring-2 focus:ring-secondary ${
                          i === 0 && photos.length > 1 ? 'col-span-2' : 'col-span-1'
                        }`}
                      >
                        <img
                          src={src}
                          alt={`${branch.name} office ${i + 1}`}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary italic">
                    No photos have been added for this branch yet.
                  </p>
                )}
              </CardBody>
            </Card>

            {/* Opening Hours */}
            {branch.openingHours && (
              <Card className="bg-white border border-gray-150">
                <CardBody className="p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-50 text-accent flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Opening Hours</h4>
                      <p className="text-lg font-extrabold text-primary">{branch.openingHours}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right Column - Contact Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <Card className="bg-white border border-gray-150 shadow-sm overflow-hidden">
              <div className="bg-primary text-white px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
                  {branch.name}
                </p>
                <h3 className="text-xl font-bold mt-0.5">Contact This Branch</h3>
              </div>

              <CardBody className="p-6 md:p-8 space-y-5">
                <div className="space-y-4">
                  {branch.address && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Address</p>
                        <p className="text-sm font-semibold text-text-primary">{branch.address}</p>
                      </div>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Phone</p>
                        <a href={`tel:${branch.phone}`} className="text-sm font-semibold text-text-primary hover:text-secondary transition-colors">
                          {branch.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {branch.email && (
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Email</p>
                        <a href={`mailto:${branch.email}`} className="text-sm font-semibold text-text-primary hover:text-secondary transition-colors truncate block">
                          {branch.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {socialItemsFor(branch).length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
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

                <div className="space-y-2 pt-1">
                  {mapLinkFor(branch) && (
                    <a
                      href={mapLinkFor(branch)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-secondary text-white text-sm font-bold hover:bg-secondary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors"
                    >
                      <Navigation className="w-4 h-4 shrink-0" />
                      Get Directions
                    </a>
                  )}
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg border border-gray-200 text-text-primary text-sm font-bold hover:border-secondary hover:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 transition-colors"
                  >
                    Book a Consultation
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>

        </div>
      </div>

      {/* Photo Lightbox */}
      {lightboxIndex !== null && photos.length > 0 && (
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
            {branch.name} — {lightboxIndex + 1} / {photos.length}
          </div>

          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goToPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {photos.length > 1 && (
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
              src={photos[lightboxIndex]}
              alt={`${branch.name} office ${lightboxIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchDetail;
