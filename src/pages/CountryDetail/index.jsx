import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  getCountryBySlug, 
  createDocument 
} from '../../firebase/firestore';
import { 
  ArrowLeft, 
  DollarSign, 
  MapPin, 
  FileText, 
  Compass, 
  BookOpen, 
  ShieldCheck,
  CheckCircle2,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useUiStore } from '../../store/uiStore';

// Zod validation schema for enquiry form
const detailEnquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const CountryDetail = () => {
  const { slug } = useParams();
  const [country, setCountry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const { showToast } = useUiStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(detailEnquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: ''
    }
  });

  useEffect(() => {
    const fetchCountry = async () => {
      setLoading(true);
      try {
        const data = await getCountryBySlug(slug);
        setCountry(data);
      } catch (error) {
        console.error('Error loading country info:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountry();
  }, [slug]);

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await createDocument('enquiries', {
        ...formData,
        country: country.name, // Context-aware country field
        status: 'new',
        createdAt: new Date().toISOString(),
        notes: ''
      });
      setSubmitSuccess(true);
      showToast(`Your enquiry for ${country.name} has been received!`, 'success');
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

  if (!country) {
    return (
      <div className="min-h-screen bg-surface pt-28 pb-20 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md bg-white p-8 rounded-lg shadow-sm border border-gray-150">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold text-primary">Country Not Found</h2>
          <p className="text-sm text-text-secondary">
            The study destination you are looking for does not exist or has been hidden by admins.
          </p>
          <Link to="/countries">
            <Button variant="secondary" className="w-full">
              Back to Countries list
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pt-24 pb-20">
      
      {/* Hero Header Banner */}
      <div className="relative bg-primary text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-20 filter blur-sm" style={{ backgroundImage: `url(${country.image})` }} />
        <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link to="/countries" className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-6 font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to Countries
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-4xl md:text-5xl">{country.flag}</span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{country.name} Requirements</h1>
          </div>
          <p className="text-gray-300 text-lg mt-4 max-w-3xl leading-relaxed">
            {country.description}
          </p>
        </div>
      </div>

      {/* Main Details Body */}
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Columns - Details */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Overview / Tuition & Living Costs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card className="bg-white border border-gray-150">
                <CardBody className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-blue-50 text-secondary flex items-center justify-center shrink-0">
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Tuition Fees</h4>
                      <p className="text-lg font-extrabold text-primary">{country.tuitionFees}</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Estimated average institutional tuition fees for international students. Varies based on courses and institutions.
                  </p>
                </CardBody>
              </Card>

              <Card className="bg-white border border-gray-150">
                <CardBody className="p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-amber-50 text-accent flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Living Costs</h4>
                      <p className="text-lg font-extrabold text-primary">{country.livingCost}</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Average yearly cost covering accommodation, transport, meals, and utilities for single students.
                  </p>
                </CardBody>
              </Card>

            </div>

            {/* Courses & Universities Details */}
            <Card className="bg-white border border-gray-150">
              <CardBody className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <BookOpen className="w-6 h-6 text-secondary" />
                  <h3 className="text-xl font-bold text-primary">Popular Courses & Academic Degrees</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">
                  The universities in {country.name} are globally renowned for research and STEM fields, offering specialized coursework:
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {country.popularCourses?.split(',').map((course, idx) => (
                    <span key={idx} className="bg-gray-100 text-text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200">
                      {course.trim()}
                    </span>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Visa Process Details */}
            <Card className="bg-white border border-gray-150">
              <CardBody className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                  <FileText className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-bold text-primary">Visa Application Process</h3>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                  {country.visaProcess || `The visa process for ${country.name} generally requires proof of university enrollment, financial sustainability certificates, travel insurance documents, and English level clearances.`}
                </p>
              </CardBody>
            </Card>

          </div>

          {/* Right Column - Side Enquiry Form (Pre-selected country) */}
          <div className="lg:col-span-4 lg:sticky lg:top-28">
            <Card className="bg-white border border-gray-150 p-6 md:p-8 shadow-sm">
              <h3 className="text-xl font-bold text-primary mb-2">Enquire About {country.name}</h3>
              <p className="text-xs text-text-secondary leading-relaxed mb-6">
                Send your profile details. Our designated specialist for {country.name} admissions will contact you.
              </p>

              {submitSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto animate-bounce" />
                  <h4 className="font-bold text-primary">Request Sent!</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    Thank you. We will evaluate your profile and contact you shortly.
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
                  <div>
                    <label className="block text-sm font-semibold text-text-primary mb-1">
                      Target Country
                    </label>
                    <input 
                      type="text" 
                      value={country.name} 
                      disabled
                      className="w-full px-4 py-2 border rounded-md shadow-sm bg-gray-100 border-gray-300 text-gray-500 font-bold"
                    />
                  </div>
                  <Input 
                    label="Academic Message" 
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
                    Submit Country Enquiry
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

export default CountryDetail;
