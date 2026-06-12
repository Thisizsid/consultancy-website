import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllDocuments } from '../../firebase/firestore';
import Card, { CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { ArrowRight, Globe } from 'lucide-react';
import Button from '../../components/ui/Button';

const Countries = () => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const data = await getAllDocuments('countries');
        // Filter out hidden countries
        setCountries(data.filter(c => c.visible !== false));
      } catch (error) {
        console.error('Error fetching countries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCountries();
  }, []);

  return (
    <div className="bg-surface min-h-screen pt-28 pb-20">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-secondary text-xs font-bold uppercase tracking-wider">
            <Globe className="w-4 h-4" />
            Global Destinations
          </div>
          <h1 className="text-4xl font-extrabold text-primary tracking-tight">
            Choose Your Destination
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Every country has its own admission structures, visa rules, and lifestyle options. Explore details to select your perfect fit.
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
            {countries.map((c) => (
              <Card key={c.id} hoverEffect className="flex flex-col h-full bg-white border border-gray-150">
                {/* Image */}
                <div className="relative h-56 w-full overflow-hidden shrink-0">
                  <img
                    src={c.image}
                    alt={c.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full text-xl shadow-sm border border-gray-100">
                    {c.flag}
                  </div>
                </div>

                {/* Body Content */}
                <CardBody className="flex-1 flex flex-col justify-between p-6">
                  <div className="space-y-4">
                    <h3 className="text-2xl font-bold text-text-primary">{c.name}</h3>
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                      {c.description}
                    </p>

                    <div className="space-y-2 pt-2 text-xs">
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-text-secondary font-medium">Tuition Fees:</span>
                        <span className="text-text-primary font-bold">{c.tuitionFees}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-100 pb-1.5">
                        <span className="text-text-secondary font-medium">Est. Living Cost:</span>
                        <span className="text-text-primary font-bold">{c.livingCost}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary font-medium">Popular Subjects:</span>
                        <span className="text-text-primary font-bold truncate max-w-[160px]" title={c.popularCourses}>
                          {c.popularCourses}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 mt-6 flex justify-end">
                    <Link to={`/countries/${c.slug}`} className="w-full">
                      <Button variant="outline" className="w-full group">
                        Explore Requirements
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Countries;
