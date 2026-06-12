import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { getAllDocuments, createDocument } from '../../firebase/firestore';
import { Calendar, MapPin, Clock, CalendarCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import { useUiStore } from '../../store/uiStore';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number must be at least 8 digits'),
});

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registering, setRegistering] = useState(false);

  const { showToast } = useUiStore();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: ''
    }
  });

  const fetchEvents = async () => {
    try {
      const data = await getAllDocuments('events');
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleRegisterClick = (eventItem) => {
    setSelectedEvent(eventItem);
    setRegisterSuccess(false);
    reset();
  };

  const handleModalSubmit = async (formData) => {
    setRegistering(true);
    try {
      await createDocument('enquiries', {
        ...formData,
        country: 'Event Registration',
        message: `Registered for event: "${selectedEvent.title}" scheduled on ${selectedEvent.date}`,
        status: 'new',
        createdAt: new Date().toISOString(),
        notes: `Event registration lead`
      });
      setRegisterSuccess(true);
      showToast(`Registered successfully for ${selectedEvent.title}!`, 'success');
    } catch (error) {
      console.error('Registration failed:', error);
      showToast('Registration failed. Please try again.', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const pastEvents = events.filter(e => e.status === 'past');

  return (
    <div className="bg-surface min-h-screen pt-28 pb-20">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-secondary text-xs font-bold uppercase tracking-wider">
            <CalendarCheck className="w-4 h-4" />
            Stay Connected
          </div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            Consultancy Seminars & Workshops
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Gain guidance by attending our physical education fairs, simulated visa interview drives, and online scholarship essays workshops.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-secondary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* Upcoming Events Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                <h2 className="text-2xl font-bold text-primary">Upcoming Events</h2>
              </div>
              
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-text-secondary italic">No upcoming seminars currently scheduled. Check back soon!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {upcomingEvents.map((e) => (
                    <Card key={e.id} hoverEffect className="bg-white flex flex-col justify-between h-full border border-gray-150">
                      <CardBody className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="info">Upcoming</Badge>
                          <span className="text-xs text-text-secondary font-bold">{e.date}</span>
                        </div>
                        <h3 className="text-lg font-bold text-text-primary">{e.title}</h3>
                        <p className="text-sm text-text-secondary leading-relaxed line-clamp-4">
                          {e.description}
                        </p>
                      </CardBody>
                      
                      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
                        <div className="flex flex-col gap-1.5 text-xs text-text-secondary">
                          <span className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-secondary shrink-0" /> {e.time}
                          </span>
                          <span className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" /> {e.location}
                          </span>
                        </div>
                        <Button 
                          variant="secondary" 
                          className="w-full text-xs py-2 mt-2"
                          onClick={() => handleRegisterClick(e)}
                        >
                          Register Free
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Events Column */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <h2 className="text-2xl font-bold text-text-primary">Past Seminars</h2>
              </div>
              
              {pastEvents.length === 0 ? (
                <p className="text-sm text-text-secondary italic">No past events registered.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {pastEvents.map((e) => (
                    <Card key={e.id} className="bg-white opacity-80 border border-gray-200">
                      <CardBody className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="neutral">Completed</Badge>
                          <span className="text-xs text-text-secondary">{e.date}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-600">{e.title}</h3>
                        <p className="text-xs text-text-secondary line-clamp-3">
                          {e.description}
                        </p>
                      </CardBody>
                      <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 text-[11px] text-text-secondary flex items-center justify-between">
                        <span>📍 {e.location}</span>
                        <span className="font-semibold text-gray-400">Completed</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Registration Modal Dialog */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={`Register for ${selectedEvent?.title}`}
        size="md"
      >
        {registerSuccess ? (
          <div className="text-center py-6 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-primary">Registration Confirmed!</h4>
            <p className="text-sm text-text-secondary">
              You have secured a seat for "{selectedEvent?.title}". We have emailed you the entry passcode.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setSelectedEvent(null)}>
              Close Modal
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleModalSubmit)} className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-md text-xs text-text-secondary space-y-1">
              <p className="font-bold text-secondary">Event Details:</p>
              <p>📅 Date: {selectedEvent?.date}</p>
              <p>⏰ Time: {selectedEvent?.time}</p>
              <p>📍 Venue: {selectedEvent?.location}</p>
            </div>

            <Input 
              label="Full Name" 
              placeholder="e.g. Michael Scott"
              {...register('name')}
              error={errors.name?.message}
            />
            
            <Input 
              label="Email Address" 
              type="email"
              placeholder="e.g. michael@dundermifflin.com"
              {...register('email')}
              error={errors.email?.message}
            />

            <Input 
              label="Phone Number" 
              placeholder="e.g. +977 98..."
              {...register('phone')}
              error={errors.phone?.message}
            />

            <Button 
              type="submit" 
              variant="secondary" 
              className="w-full" 
              loading={registering}
            >
              Confirm Seat
            </Button>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default Events;
