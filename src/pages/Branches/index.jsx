import React, { useEffect, useState } from 'react';
import {
  GitBranch,
  MapPin,
  Phone,
  Mail,
  Clock,
  Building2,
} from 'lucide-react';
import { getAllDocuments } from '../../firebase/firestore';
import Badge from '../../components/ui/Badge';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

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
                  className="group bg-white border border-gray-150 rounded-xl p-6 flex flex-col gap-5 shadow-sm hover:shadow-lg hover:border-secondary/30 transition-all duration-300"
                >
                  {/* Header */}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Branches;
