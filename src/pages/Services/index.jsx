import React, { useEffect, useState } from 'react';
import { getAllDocuments } from '../../firebase/firestore';
import { 
  Compass, 
  School, 
  FileText, 
  CheckSquare, 
  Edit3, 
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Card, { CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Link } from 'react-router-dom';

const iconMap = {
  Compass: Compass,
  School: School,
  FileText: FileText,
  CheckSquare: CheckSquare,
  Edit3: Edit3,
  Award: Award
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await getAllDocuments('services');
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div className="bg-surface min-h-screen pt-28 pb-20">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-100 text-accent text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            Expert Academic Support
          </div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            Our Consultancy Services
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            We provide full-spectrum services ranging from academic profile evaluation and university matches to visa counseling and arrival accommodation assistance.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((s, idx) => {
              const ServiceIcon = iconMap[s.icon] || Compass;
              return (
                <Card key={idx} className="bg-white p-8 flex flex-col justify-between h-full border border-gray-150 hover:border-gray-200 transition-all">
                  <div className="space-y-4">
                    <div className="w-12 h-12 rounded-md bg-blue-50 text-secondary flex items-center justify-center">
                      <ServiceIcon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary">{s.title}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {s.description}
                    </p>
                  </div>
                  <div className="pt-6 border-t border-gray-100 mt-6 flex items-center justify-between text-xs font-semibold">
                    <span className="text-secondary uppercase tracking-wider">Expert Guidance</span>
                    <Link to="/contact" className="text-primary hover:text-secondary flex items-center gap-1">
                      Enquire <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Banner CTA */}
        <div className="mt-16 bg-gradient-to-r from-primary to-blue-950 text-white rounded-lg p-8 md:p-12 shadow-md flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <h3 className="text-2xl font-bold">Unsure which service is right for you?</h3>
            <p className="text-sm text-gray-300">
              Schedule a comprehensive counseling call with our advisors. We will customize your study plan for free.
            </p>
          </div>
          <Link to="/contact" className="shrink-0">
            <Button variant="secondary" size="lg">
              Book Free Session
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Services;
