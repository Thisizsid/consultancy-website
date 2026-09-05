import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  getServiceBySlug,
  getAllDocuments,
  createDocument,
} from '../../services/api';
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  School,
  FileText,
  CheckSquare,
  Edit3,
  Award,
  Check,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import { useUiStore } from '../../store/uiStore';
import { documentSlug } from '../../utils/slug';
import { useSEO } from '../../hooks/useSEO';

// Same mapping used by the Services grid, the nav dropdown and the CMS —
// the stored `icon` string is a key into this, not a component reference.
const iconMap = {
  Compass,
  School,
  FileText,
  CheckSquare,
  Edit3,
  Award,
};

const serviceEnquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  country: z.string().min(2, 'Tell us which destination you have in mind'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const ServiceDetail = () => {
  const { slug } = useParams();
  const [service, setService] = useState(null);
  const [otherServices, setOtherServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useSEO({
    title: service ? `${service.title} Services` : undefined,
    description: service?.description,
    path: `/services/${slug}`,
  });

  const { showToast } = useUiStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(serviceEnquirySchema),
    defaultValues: { name: '', email: '', phone: '', country: '', message: '' },
  });

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true);
      // Reset first: navigating between two service pages reuses this
      // component, and the previous service must not linger while the new
      // one loads.
      setService(null);
      try {
        const data = await getServiceBySlug(slug);
        setService(data);
      } catch (error) {
        console.error('Error loading service:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchService();
    window.scrollTo({ top: 0 });
  }, [slug]);

  // Sibling services for the "explore more" strip at the bottom.
  useEffect(() => {
    const fetchOthers = async () => {
      try {
        const all = await getAllDocuments('services');
        setOtherServices(all.filter((s) => documentSlug(s) !== slug));
      } catch {
        setOtherServices([]);
      }
    };
    fetchOthers();
  }, [slug]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await createDocument('enquiries', {
        ...formData,
        // Enquiries have no dedicated service field, so the service this came
        // from is stamped onto the message where the admin will actually see it.
        message: `Service of interest: ${service.title}\n\n${formData.message}`,
        status: 'new',
        createdAt: new Date().toISOString(),
        notes: '',
      });
      setSubmitSuccess(true);
      showToast(`Your enquiry about ${service.title} has been received!`, 'success');
      reset();
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err) {
      console.error('Submit error:', err);
      showToast('Enquiry submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <svg className="animate-spin h-10 w-10 text-secondary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-surface pt-28 pb-20 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-lg shadow-sm border border-gray-150">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
          <h2 className="text-2xl font-bold text-primary">Service Not Found</h2>
          <p className="text-sm text-text-secondary">
            The service you are looking for does not exist or is no longer offered.
          </p>
          <Link to="/services">
            <Button variant="secondary" className="w-full">
              Back to all services
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const ServiceIcon = iconMap[service.icon] || Compass;
  const includes = Array.isArray(service.includes) ? service.includes.filter(Boolean) : [];

  return (
    <div className="bg-surface min-h-screen pt-24 pb-20">

      {/* Hero Header Banner */}
      <div className="relative bg-primary text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-950" />
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/services" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-6 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Services
          </Link>
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <ServiceIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{service.title}</h1>
              <p className="text-gray-300 text-lg mt-4 max-w-3xl leading-relaxed">
                {service.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column — Content */}
          <div className="lg:col-span-8 space-y-8">

            {/* Overview */}
            <Card className="bg-white border border-gray-150">
              <CardBody className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <Sparkles className="w-6 h-6 text-secondary" />
                  <h2 className="text-xl font-bold text-primary">Overview</h2>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {service.longDescription || service.description}
                </p>
              </CardBody>
            </Card>

            {/* What's Included */}
            {includes.length > 0 && (
              <Card className="bg-white border border-gray-150">
                <CardBody className="p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <CheckSquare className="w-6 h-6 text-accent" />
                    <h2 className="text-xl font-bold text-primary">What's Included</h2>
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                    {includes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                        <span className="text-sm text-text-secondary leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}

            {/* Other Services */}
            {otherServices.length > 0 && (
              <Card className="bg-white border border-gray-150">
                <CardBody className="p-6 md:p-8 space-y-4">
                  <h2 className="text-xl font-bold text-primary border-b border-gray-100 pb-4">
                    Other services we offer
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {otherServices.map((s) => {
                      const OtherIcon = iconMap[s.icon] || Compass;
                      return (
                        <Link
                          key={s.id || documentSlug(s)}
                          to={`/services/${documentSlug(s)}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-secondary flex items-center justify-center shrink-0">
                            <OtherIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-semibold text-text-primary group-hover:text-secondary truncate flex-1">
                            {s.title}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 transition-transform group-hover:translate-x-1" />
                        </Link>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            )}

          </div>

          {/* Right Column — Enquiry Form */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <Card className="bg-white border border-gray-150 p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-2">Enquire About This Service</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6">
                Tell us where you are in your journey and an advisor will walk you through {service.title.toLowerCase()}.
              </p>

              {submitSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                  <h4 className="font-bold text-primary">Request Sent!</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Thank you. One of our advisors will be in touch shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Jane Doe"
                    {...register('name')}
                    error={errors.name?.message}
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. jane@example.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="e.g. +977 980..."
                    {...register('phone')}
                    error={errors.phone?.message}
                  />
                  <Input
                    label="Destination of Interest"
                    placeholder="e.g. Australia"
                    {...register('country')}
                    error={errors.country?.message}
                  />
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">
                      Service
                    </label>
                    <input
                      type="text"
                      value={service.title}
                      disabled
                      className="w-full px-4 py-2 border rounded-md shadow-sm bg-gray-100 border-gray-300 text-gray-500 font-bold"
                    />
                  </div>
                  <Input
                    label="Your Message"
                    type="textarea"
                    rows={3}
                    placeholder="Mention your GPA, IELTS score, and current qualification..."
                    {...register('message')}
                    error={errors.message?.message}
                  />

                  <Button
                    type="submit"
                    variant="secondary"
                    className="w-full"
                    loading={submitting}
                  >
                    Submit Service Enquiry
                  </Button>
                </form>
              )}
            </Card>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ServiceDetail;
