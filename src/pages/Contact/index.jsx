import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createDocument } from '../../firebase/firestore';
import { Mail, Phone, MapPin, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useUiStore } from '../../store/uiStore';

const contactFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
  country: z.string().min(1, 'Please select a target country'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const Contact = () => {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { showToast } = useUiStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      country: '',
      message: ''
    }
  });

  const onSubmit = async (formData) => {
    setSubmitting(true);
    try {
      await createDocument('enquiries', {
        ...formData,
        status: 'new',
        createdAt: new Date().toISOString(),
        notes: ''
      });
      setSuccess(true);
      showToast('Thank you! We will contact you soon.', 'success');
      reset();
      setTimeout(() => setSuccess(false), 5000);
    } catch (error) {
      console.error('Submit contact error:', error);
      showToast('Failed to submit message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen pt-28 pb-20">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-secondary text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-4 h-4" />
            Get In Touch
          </div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            Contact Lasso Consultancy
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Have questions about universities, tuition brackets, or visa regulations? Get in touch with our team of global experts today.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Columns - Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            <Card className="bg-white border border-gray-150 p-6 md:p-8 space-y-6">
              <h3 className="text-xl font-bold text-primary border-b border-gray-100 pb-4">Corporate Office</h3>
              
              <ul className="space-y-5 text-sm text-text-secondary">
                <li className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text-primary">Kathmandu Branch</p>
                    <p className="mt-0.5">102 Premium Plaza, Parliament Road, Kathmandu, Nepal</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <Phone className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text-primary">Contact Numbers</p>
                    <p className="mt-0.5">+977 1-4433221</p>
                    <p>+977 9801234567 (WhatsApp available)</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <Mail className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text-primary">Email Correspondence</p>
                    <p className="mt-0.5">info@lassoconsultancy.com</p>
                    <p>admissions@lassoconsultancy.com</p>
                  </div>
                </li>

                <li className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-text-primary">Admissions Hours</p>
                    <p className="mt-0.5">Sunday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: Closed</p>
                  </div>
                </li>
              </ul>
            </Card>

            {/* Map Embed Container */}
            <Card className="bg-white border border-gray-150 overflow-hidden h-64 relative">
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center p-6 text-center">
                <div className="space-y-2">
                  <MapPin className="w-10 h-10 text-accent mx-auto animate-bounce" />
                  <h4 className="font-bold text-primary">Interactive Office Map</h4>
                  <p className="text-xs text-text-secondary">
                    102 Premium Plaza, Parliament Road, Kathmandu, Nepal
                  </p>
                  <a 
                    href="https://maps.google.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs text-secondary font-bold hover:underline block pt-2"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </Card>

          </div>

          {/* Right Column - Contact Form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-lg border border-gray-150 shadow-sm">
            <h3 className="text-2xl font-bold text-primary mb-2">Send Message</h3>
            <p className="text-sm text-text-secondary mb-6">
              Complete the profile fields below and our counselors will get in touch with you shortly.
            </p>

            {success ? (
              <div className="p-8 text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                <h4 className="text-xl font-bold text-primary">Message Dispatched!</h4>
                <p className="text-sm text-text-secondary">
                  Thank you for writing to Lasso Consultancy. We have recorded your query and will reply via email.
                </p>
                <Button variant="outline" onClick={() => setSuccess(false)}>
                  Write Another Message
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
                    placeholder="e.g. john@gmail.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Phone Number" 
                    placeholder="e.g. +977 98..."
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
                  label="Message Details" 
                  type="textarea"
                  placeholder="Enter details here about your target program, GPA, and questions..."
                  {...register('message')}
                  error={errors.message?.message}
                />

                <Button 
                  type="submit" 
                  variant="secondary" 
                  className="w-full" 
                  loading={submitting}
                >
                  Send Message
                </Button>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
