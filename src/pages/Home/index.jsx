import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Users,
  Globe2,
  BookOpen,
  Star,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  MapPin
} from 'lucide-react';
import { getAllDocuments, createDocument } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useUiStore } from '../../store/uiStore';

// Zod validation schema for enquiry form
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  country: z.string().min(1, 'Please select a destination country'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

/**
 * Wraps a hero CTA in the right kind of link. Admin-entered links may be an
 * in-page anchor ("#contact-section"), an app route ("/countries"), or an
 * external URL — and a route needs <Link> to avoid a full page reload, while
 * the other two need a plain <a>. Renders the button unwrapped rather than
 * linking nowhere when no link was given.
 */
const HeroButtonLink = ({ to, children }) => {
  if (!to) return <div className="w-full sm:w-auto">{children}</div>;

  const isInternalRoute = to.startsWith('/') && !to.startsWith('//');
  if (isInternalRoute) {
    return <Link to={to} className="w-full sm:w-auto">{children}</Link>;
  }

  const isExternal = /^https?:\/\//i.test(to);
  return (
    <a
      href={to}
      className="w-full sm:w-auto"
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  );
};

const Home = () => {
  const [countries, setCountries] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [events, setEvents] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const { showToast } = useUiStore();

  // Hero slide states
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cmsSlides, setCmsSlides] = useState([]);
  // A slide's photo can still fail to load — a CMS upload that 404s, or one of
  // the hotlinked fallback photos being blocked. Track the failures so those
  // slides show a branded gradient rather than leaving the headline sitting on
  // an empty black box.
  const [failedSlides, setFailedSlides] = useState({});
  // Used only until the admin adds hero slides in the CMS. These photos are
  // hotlinked from a third-party CDN and so can be blocked; that's precisely
  // why the CMS-managed slides (served from our own /uploads) supersede them.
  const defaultHeroSlides = [
    {
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1600&auto=format&fit=crop&q=80',
      badge: 'Trusted Global Admissions Partner',
      title: 'Study Abroad with Lasso Consultancy',
      description: 'Guiding ambitious students from profile analysis and university shortlists to flawless visa compliance and academic scholarship awards.',
      primaryBtnText: 'Book Free Consultation',
      primaryBtnLink: '#contact-section',
      secondaryBtnText: 'Explore Countries',
      secondaryBtnLink: '/countries'
    },
    {
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1600&auto=format&fit=crop&q=80',
      badge: 'Certified Admissions Support',
      title: 'Get Admission in Top Global Universities',
      description: 'Benefit from our direct partnerships with 200+ elite QS-ranked colleges and universities across the US, UK, Canada, Australia, and Europe.',
      primaryBtnText: 'Explore Partners',
      primaryBtnLink: '#contact-section',
      secondaryBtnText: 'Our Services',
      secondaryBtnLink: '/services'
    },
    {
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1600&auto=format&fit=crop&q=80',
      badge: 'Simulated Visa Audits',
      title: '98.4% Proven Visa Success Rate',
      description: 'Simulate mock visa interviews under embassy conditions with former immigration officers to guarantee a clean compliance approval.',
      primaryBtnText: 'Book Visa Counseling',
      primaryBtnLink: '#contact-section',
      secondaryBtnText: 'Upcoming Seminars',
      secondaryBtnLink: '/events'
    }
  ];

  // CMS slides win outright once any exist, so the admin never ends up with
  // their photos mixed in among the stock defaults.
  const heroSlides = cmsSlides.length > 0 ? cmsSlides : defaultHeroSlides;

  // failedSlides is keyed by image URL (not array index): the hero starts
  // out showing the default slides while CMS data is still loading, and a
  // default photo failing (e.g. CSP-blocked) must not permanently mark the
  // real CMS photo that later takes over the same index as failed too.
  useEffect(() => {
    setFailedSlides({});
  }, [cmsSlides]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Guards against a stale index when the CMS slide count shrinks (a slide
  // deleted or deactivated) while a later slide is showing.
  useEffect(() => {
    setCurrentSlide((prev) => (prev >= heroSlides.length ? 0 : prev));
  }, [heroSlides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      message: ''
    }
  });

  // Fetch website data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cnts, tstms, evts, ptns, hero] = await Promise.all([
          getAllDocuments('countries'),
          getAllDocuments('testimonials'),
          getAllDocuments('events'),
          getAllDocuments('partners'),
          getAllDocuments('hero'),
        ]);

        setCmsSlides(
          hero
            .filter((s) => s.status === 'active' && s.image)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        );

        setCountries(cnts.filter(c => c.visible !== false));
        setTestimonials(tstms.slice(0, 3));
        setEvents(
          evts
            .filter(e => e.status === 'upcoming')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 3)
        );
        setPartners(ptns);
      } catch (error) {
        console.error('Error fetching landing data:', error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await createDocument('enquiries', {
        ...data,
        status: 'new',
        createdAt: new Date().toISOString(),
        notes: ''
      });
      setSubmitSuccess(true);
      showToast('Your consultation request has been submitted successfully!', 'success');
      reset();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Form submit error:', error);
      showToast('Failed to submit. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // `events` is already filtered to upcoming and sorted soonest-first above,
  // so the first entry is the single next event for the spotlight section.
  const nextEvent = events[0] || null;
  const nextEventDate = nextEvent ? new Date(`${nextEvent.date}T00:00:00`) : null;
  const nextEventDay = nextEventDate ? nextEventDate.getDate() : null;
  const nextEventMonth = nextEventDate
    ? nextEventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    : null;
  const nextEventYear = nextEventDate ? nextEventDate.getFullYear() : null;

  return (
    <div className="overflow-hidden">
      {/* 1. HERO SECTION SLIDER */}
      <section className="relative h-[80vh] min-h-[620px] w-full bg-slate-950 overflow-hidden">
        
        {/* Slides */}
        <div className="absolute inset-0 w-full h-full">
          {heroSlides.map((slide, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={index}
                className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 pointer-events-none z-0'
                }`}
              >
                {/* Image background with dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent z-10 pointer-events-none" />
                {failedSlides[slide.image] ? (
                  <div className="w-full h-full bg-gradient-to-br from-primary via-primary-light to-accent" />
                ) : (
                  <img
                    src={slide.image}
                    alt={slide.title}
                    onError={() => setFailedSlides((prev) => ({ ...prev, [slide.image]: true }))}
                    className="w-full h-full object-cover object-center transform transition-transform duration-10000 ease-linear"
                  />
                )}
                
                {/* Content Container */}
                {/* Top padding clears the transparent fixed navbar on small screens */}
                <div className="absolute inset-0 z-20 flex items-center pt-28 pb-16 md:pt-20 md:pb-0">
                  <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="max-w-3xl space-y-6 text-left">
                      
                      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-xs font-bold uppercase tracking-wider transition-all duration-700 delay-300 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}>
                        <ShieldCheck className="w-4 h-4 text-accent" />
                        {slide.badge}
                      </div>

                      <h1 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-white transition-all duration-700 delay-500 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}>
                        {slide.title}
                      </h1>

                      <p className={`text-gray-300 text-lg md:text-xl leading-relaxed max-w-2xl transition-all duration-700 delay-700 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}>
                        {slide.description}
                      </p>

                      <div className={`flex flex-col sm:flex-row items-center gap-4 pt-2 transition-all duration-700 delay-900 ${
                        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                      }`}>
                        {slide.primaryBtnText && (
                          <HeroButtonLink to={slide.primaryBtnLink}>
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto shadow-md hover:shadow-lg">
                              {slide.primaryBtnText}
                            </Button>
                          </HeroButtonLink>
                        )}

                        {slide.secondaryBtnText && (
                          <HeroButtonLink to={slide.secondaryBtnLink}>
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-white border-white hover:bg-white/10">
                              {slide.secondaryBtnText}
                            </Button>
                          </HeroButtonLink>
                        )}
                      </div>

                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* Previous Arrow */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white transition-all backdrop-blur-sm hidden md:block"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next Arrow */}
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 text-white transition-all backdrop-blur-sm hidden md:block"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-secondary w-8' : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

      </section>

      {/* 2. STATS SECTION */}
      <section className="bg-surface py-12 border-b border-gray-150">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-primary">5,000+</p>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Students Placed</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-secondary">15+</p>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Destinations</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-accent">200+</p>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Partner Universities</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl md:text-4xl font-extrabold text-accent-light">98.4%</p>
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Visa Success Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COUNTRIES SECTION */}
      <section className="py-20 md:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="info">GLOBAL DESTINATIONS</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">Popular Countries to Study Abroad</h2>
            <p className="text-text-secondary leading-relaxed">
              Explore tuition costs, popular academic programs, living guidelines, and simple visa pathways for top global destinations.
            </p>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-10">
              <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {countries.slice(0, 3).map((c) => (
                <Card key={c.id} hoverEffect className="flex flex-col h-full bg-white">
                  <div className="relative h-48 w-full overflow-hidden shrink-0">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <CardBody className="flex-1 flex flex-col justify-between p-6">
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-text-primary">{c.name}</h3>
                      <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
                        {c.description}
                      </p>
                    </div>
                    <div className="pt-5 border-t border-gray-150 mt-5 flex items-center justify-between">
                      <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">
                        Fee: {c.tuitionFees?.split('-')[0] || 'Flexible'}
                      </span>
                      <Link to={`/countries/${c.slug}`} className="text-secondary font-bold text-sm inline-flex items-center gap-1 hover:gap-2 transition-all">
                        View Details <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}

          {countries.length > 3 && (
            <div className="text-center mt-12">
              <Link to="/countries">
                <Button variant="outline">View All Countries</Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 4. UPCOMING EVENT SECTION */}
      <section className="py-20 md:py-24 bg-surface">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="warning">UPCOMING EVENT</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">Save the Date for Our Next Event</h2>
            <p className="text-text-secondary leading-relaxed">
              Seminars, scholarship workshops, and pre-departure briefings hosted by our expert counselors.
            </p>
          </div>

          {loadingData ? (
            <div className="flex justify-center py-10">
              <svg className="animate-spin h-8 w-8 text-secondary" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : nextEvent ? (
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl border border-gray-150 overflow-hidden md:flex">
              {/* Date block */}
              <div className="md:w-56 shrink-0 bg-gradient-to-br from-primary via-primary-light to-accent text-white p-8 flex md:flex-col items-center justify-center gap-4 md:gap-1 text-center">
                <p className="text-5xl font-extrabold leading-none">{nextEventDay}</p>
                <div className="text-left md:text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-white/80">{nextEventMonth}</p>
                  <p className="text-xs text-white/60">{nextEventYear}</p>
                </div>
              </div>

              {/* Details */}
              <div className="p-8 md:p-10 flex-1 space-y-5">
                <h3 className="text-2xl font-bold text-text-primary">{nextEvent.title}</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-text-secondary font-medium">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-secondary shrink-0" /> {nextEvent.time}
                  </span>
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-secondary shrink-0" /> {nextEvent.location}
                  </span>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  {nextEvent.description}
                </p>
                <Link to="/events">
                  <Button variant="secondary">Register Now</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto text-center bg-white rounded-lg border border-dashed border-gray-200 p-12 md:p-16 space-y-4">
              <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-text-primary">No Upcoming Events</h3>
              <p className="text-text-secondary leading-relaxed max-w-md mx-auto">
                We don't have any seminars or workshops scheduled right now. Check back soon, or reach out directly to discuss your study plans with a counselor.
              </p>
              <a href="#contact-section">
                <Button variant="outline">Talk to a Counselor</Button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-20 md:py-24">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Block */}
            <div className="space-y-6">
              <Badge variant="success">WHY LASSO</Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-primary leading-tight">
                Decades of Shared Expertise and Trust
              </h2>
              <p className="text-text-secondary leading-relaxed">
                With a robust global university link and a team composed of certified career counselors, we strive to render the study abroad ecosystem reliable and seamless.
              </p>
              
              <div className="space-y-4 pt-2">
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Accredited Counselors</h4>
                    <p className="text-sm text-text-secondary">Certified counselors with direct access to foreign admissions councils.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Comprehensive SOP & LOR Review</h4>
                    <p className="text-sm text-text-secondary">Dedicated editorial team to verify, structure, and polish academic statements.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-secondary/15 text-secondary flex items-center justify-center shrink-0 mt-1">
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Visa Mock Simulations</h4>
                    <p className="text-sm text-text-secondary">Simulate actual embassy interviews with experts to gain bulletproof confidence.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Decorative Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-secondary/5 border border-secondary/15 p-6 md:p-8 rounded-lg space-y-3">
                <Users className="w-8 h-8 text-secondary" />
                <h4 className="font-bold text-primary">5,000+ Students</h4>
                <p className="text-xs text-text-secondary">Placed in top QS-ranked global schools.</p>
              </div>
              <div className="bg-accent/5 border border-accent/15 p-6 md:p-8 rounded-lg space-y-3 sm:mt-6">
                <Globe2 className="w-8 h-8 text-accent" />
                <h4 className="font-bold text-primary">15+ Nations</h4>
                <p className="text-xs text-text-secondary">Worldwide study destinations available.</p>
              </div>
              <div className="bg-secondary/5 border border-secondary/15 p-6 md:p-8 rounded-lg space-y-3 sm:-mt-6">
                <BookOpen className="w-8 h-8 text-secondary-dark" />
                <h4 className="font-bold text-primary">Scholarships</h4>
                <p className="text-xs text-text-secondary">Direct assistance with institutional aid.</p>
              </div>
              <div className="bg-accent/5 border border-accent/15 p-6 md:p-8 rounded-lg space-y-3">
                <ShieldCheck className="w-8 h-8 text-accent-light" />
                <h4 className="font-bold text-primary">End-to-End</h4>
                <p className="text-xs text-text-secondary">Right from passport to pre-departure lodging.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. TESTIMONIALS */}
      <section className="py-20 md:py-24 bg-surface">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="info">STUDENT VOICES</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-primary">Testimonials from Our Scholars</h2>
            <p className="text-text-secondary leading-relaxed">
              Read how Lasso Consultancy helped these students gain international acceptances.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <Card key={idx} className="bg-white p-6 flex flex-col justify-between h-full border border-gray-150">
                <div className="space-y-4">
                  <div className="flex gap-0.5 text-amber-500">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-text-secondary italic leading-relaxed">
                    "{t.text}"
                  </p>
                </div>
                <div className="flex items-center gap-3.5 pt-6 border-t border-gray-100 mt-6">
                  <img 
                    src={t.image} 
                    alt={t.studentName} 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">{t.studentName}</h4>
                    <p className="text-xs text-text-secondary font-medium">Studying in {t.country}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PARTNER UNIVERSITIES LOGOS */}
      <section className="py-12 border-b border-gray-150 bg-white">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-text-secondary uppercase tracking-wider mb-8">
            Partnered with Leading World Universities & Educational Bodies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
            {partners.map((partner, idx) => {
              const logo = (
                <>
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="h-10 w-10 rounded-full object-cover border border-gray-200"
                  />
                  <span className="text-sm font-extrabold text-primary tracking-tight">{partner.name}</span>
                </>
              );

              const shared = 'flex items-center gap-2 filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all';

              // Partners without a website link stay non-interactive
              return partner.website ? (
                <a
                  key={idx}
                  href={partner.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Visit ${partner.name}`}
                  className={`${shared} rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2`}
                >
                  {logo}
                </a>
              ) : (
                <div key={idx} className={`${shared} cursor-default`}>
                  {logo}
                </div>
              );
            })}
          </div>
        </div>
      </section>



      {/* 10. CONTACT SECTION */}
      <section id="contact-section" className="py-20 md:py-24 bg-gradient-to-br from-primary via-primary-light to-accent text-white">
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Block */}
            <div className="lg:col-span-5 space-y-6">
              <Badge variant="accent">FREE SESSION</Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Ready to take the first step towards global education?
              </h2>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                Fill in the details to schedule a free one-on-one session with our experienced consultants. We will evaluate your profile and map matching universities.
              </p>
              
              <div className="h-[1px] bg-slate-800 w-full" />
              
              <div className="space-y-3 text-sm text-gray-300">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary shrink-0" strokeWidth={3} /> 100% Confidentiality</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary shrink-0" strokeWidth={3} /> Comprehensive Profile Evaluation</p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-secondary shrink-0" strokeWidth={3} /> Zero Upfront Consultancy Fees</p>
              </div>
            </div>

            {/* Form Right Block */}
            <div className="lg:col-span-7 bg-white text-text-primary p-6 md:p-8 rounded-lg shadow-xl border border-white/10 relative">
              <h3 className="text-2xl font-bold text-primary mb-6">Book Free Consultation</h3>
              
              {submitSuccess ? (
                <div className="p-8 text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                  <h4 className="text-xl font-bold text-primary">Request Received!</h4>
                  <p className="text-sm text-text-secondary">
                    Thank you for contacting Lasso Consultancy. Our counseling desk will call you within 24 business hours.
                  </p>
                  <Button variant="outline" onClick={() => setSubmitSuccess(false)}>
                    Submit Another Request
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Full Name" 
                      placeholder="e.g. John Doe"
                      {...register('name')}
                      error={errors.name?.message}
                    />
                    <Input 
                      label="Email Address" 
                      type="email"
                      placeholder="e.g. john@example.com"
                      {...register('email')}
                      error={errors.email?.message}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Phone Number" 
                      placeholder="e.g. +977 9801234567"
                      {...register('phone')}
                      error={errors.phone?.message}
                    />
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-1.5">
                        Destination Country
                      </label>
                      <select 
                        className="w-full px-4 py-2 border rounded-md shadow-sm bg-white border-gray-300 text-text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors"
                        {...register('country')}
                      >
                        <option value="">-- Select Country --</option>
                        <option value="Australia">Australia</option>
                        <option value="Canada">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="USA">United States</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="Europe">Europe</option>
                      </select>
                      {errors.country && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{errors.country.message}</p>
                      )}
                    </div>
                  </div>

                  <Input 
                    label="Brief message / academic profile"
                    type="textarea"
                    placeholder="Provide details about your academic background (GPA, IELTS/PTE scores) and target program..."
                    {...register('message')}
                    error={errors.message?.message}
                  />

                  <Button 
                    type="submit" 
                    variant="secondary" 
                    className="w-full" 
                    loading={submitting}
                  >
                    Submit Booking Request
                  </Button>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
