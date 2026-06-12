import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStore } from '../../../store/dashboardStore';
import { 
  Globe, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  Inbox
} from 'lucide-react';
import Card, { CardHeader, CardBody, CardFooter } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { getAllDocuments } from '../../../firebase/firestore';

const Dashboard = () => {
  const { stats, fetchStats, loadingStats } = useDashboardStore();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const fetchRecentEvents = async () => {
      try {
        const eventsData = await getAllDocuments('events');
        // Sort and get upcoming
        const filtered = eventsData
          .filter(e => e.status === 'upcoming')
          .slice(0, 4);
        setUpcomingEvents(filtered);
      } catch (err) {
        console.error('Error fetching dashboard events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchRecentEvents();
  }, []);

  const statsCards = [
    { name: 'Countries', value: stats.countries, icon: Globe, color: 'text-secondary bg-secondary/10 border-secondary/20', path: '/admin/countries' },
    { name: 'Services', value: stats.services, icon: Briefcase, color: 'text-secondary bg-secondary/10 border-secondary/20', path: '/admin/services' },
    { name: 'Events', value: stats.events, icon: Calendar, color: 'text-accent-light bg-accent/10 border-accent/20', path: '/admin/events' },
    { name: 'Testimonials', value: stats.testimonials, icon: MessageSquare, color: 'text-accent-light bg-accent/10 border-accent/20', path: '/admin/testimonials' },
    { 
      name: 'Enquiries', 
      value: stats.enquiries, 
      icon: Inbox, 
      color: 'text-secondary bg-secondary/10 border-secondary/20', 
      path: '/admin/enquiries',
      badge: stats.newEnquiries > 0 ? stats.newEnquiries : null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Block */}
      <div className="bg-gradient-to-r from-primary via-primary-light to-accent p-6 md:p-8 rounded-lg text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
            Welcome back to Lasso CMS! <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </h1>
          <p className="text-sm text-gray-300">
            Monitor study destinations, active counselor services, and update scheduled student fair workshops.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/countries">
            <Button variant="secondary" size="sm" icon={Plus}>Add Country</Button>
          </Link>
          <Link to="/admin/events">
            <Button variant="outline" size="sm" className="text-white border-white/30 hover:bg-white/10" icon={Plus}>Add Event</Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards Grid */}
      {loadingStats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <Card key={idx} className="bg-white border border-gray-150 animate-pulse">
              <CardBody className="p-6 h-28" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.name} to={card.path}>
                <Card hoverEffect className="bg-white border border-gray-150 h-full">
                  <CardBody className="p-6 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">{card.name}</p>
                        {card.badge && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-white">
                            {card.badge} new
                          </span>
                        )}
                      </div>
                      <p className="text-3xl font-extrabold text-primary">{card.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-md border flex items-center justify-center shrink-0 ${card.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Main Grid: Upcoming Seminars & Quick Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upcoming Seminars */}
        <div className="lg:col-span-8">
          <Card className="bg-white border border-gray-150 h-full">
            <CardHeader className="flex justify-between items-center px-6 py-4">
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-secondary" /> Upcoming Seminars & Events
              </h3>
              <Link to="/admin/events" className="text-xs font-semibold text-secondary hover:underline flex items-center gap-0.5">
                Manage Events <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <CardBody className="p-6">
              {loadingEvents ? (
                <div className="flex justify-center py-10">
                  <svg className="animate-spin h-6 w-6 text-secondary" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-sm text-text-secondary italic text-center py-6">No upcoming events listed. Click "Add Event" to schedule one.</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {upcomingEvents.map((e) => (
                    <div key={e.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 max-w-lg">
                        <h4 className="font-bold text-text-primary text-sm">{e.title}</h4>
                        <p className="text-xs text-text-secondary line-clamp-2">{e.description}</p>
                        <p className="text-[10px] text-accent font-semibold">📍 Venue: {e.location}</p>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <Badge variant="info">{e.date}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Quick shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border border-gray-150">
            <CardHeader>
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" /> Quick Operations
              </h3>
            </CardHeader>
            <CardBody className="p-5 space-y-3">
              <Link to="/admin/countries">
                <Button variant="outline" className="w-full text-left justify-between py-2 text-xs font-semibold mb-2">
                  <span>Manage Country Slugs</span>
                  <ArrowRight className="w-4 h-4 text-text-secondary" />
                </Button>
              </Link>
              <Link to="/admin/services">
                <Button variant="outline" className="w-full text-left justify-between py-2 text-xs font-semibold mb-2">
                  <span>Modify Consultancy Services</span>
                  <ArrowRight className="w-4 h-4 text-text-secondary" />
                </Button>
              </Link>
              <Link to="/admin/testimonials">
                <Button variant="outline" className="w-full text-left justify-between py-2 text-xs font-semibold mb-2">
                  <span>Review Testimonials</span>
                  <ArrowRight className="w-4 h-4 text-text-secondary" />
                </Button>
              </Link>
              <Link to="/admin/partners">
                <Button variant="outline" className="w-full text-left justify-between py-2 text-xs font-semibold">
                  <span>Update University Partners</span>
                  <ArrowRight className="w-4 h-4 text-text-secondary" />
                </Button>
              </Link>
            </CardBody>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
