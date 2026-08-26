import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { getDocument } from '../../services/api';
import { FacebookIcon, InstagramIcon, TiktokIcon } from '../icons/SocialIcons';
import logo from '../../assets/logo.png';

const DEFAULT_OFFICE_HOURS = [
  { days: 'Sunday - Friday', hours: '9:00 AM - 6:00 PM', closed: false },
  { days: 'Saturday', hours: 'Closed', closed: true },
];

const DEFAULT_ABOUT_US = {
  tagline: 'Connecting Students to Global Opportunities',
  description: 'Lasso Consultancy is a premier study abroad counseling platform helping students gain admission and visa approvals for top global education hubs.',
};

const DEFAULT_CONTACT_INFO = {
  address: '102 Premium Plaza, Parliament Road, Kathmandu, Nepal',
  phone: '+977 1-4433221',
  email: 'info@lassoconsultancy.com',
};

const DEFAULT_SOCIAL_LINKS = {
  facebook: '',
  instagram: '',
  tiktok: '',
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [officeHours, setOfficeHours] = useState(DEFAULT_OFFICE_HOURS);
  const [aboutUs, setAboutUs] = useState(DEFAULT_ABOUT_US);
  const [contactInfo, setContactInfo] = useState(DEFAULT_CONTACT_INFO);
  const [socialLinks, setSocialLinks] = useState(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await getDocument('settings', 'site_settings');
        if (Array.isArray(settings.officeHours) && settings.officeHours.length > 0) {
          setOfficeHours(settings.officeHours);
        }
        if (settings.aboutUs) {
          setAboutUs({ ...DEFAULT_ABOUT_US, ...settings.aboutUs });
        }
        if (settings.contactInfo) {
          setContactInfo({ ...DEFAULT_CONTACT_INFO, ...settings.contactInfo });
        }
        if (settings.socialLinks) {
          setSocialLinks({ ...DEFAULT_SOCIAL_LINKS, ...settings.socialLinks });
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const socialItems = [
    { key: 'facebook', url: socialLinks.facebook, Icon: FacebookIcon, label: 'Facebook' },
    { key: 'instagram', url: socialLinks.instagram, Icon: InstagramIcon, label: 'Instagram' },
    { key: 'tiktok', url: socialLinks.tiktok, Icon: TiktokIcon, label: 'TikTok' },
  ].filter((item) => item.url);

  return (
    <footer className="bg-primary text-white border-t border-gray-800">
      <div className="max-w-container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">

          {/* Logo & Branding */}
          <div className="flex flex-col justify-center gap-5 lg:h-full lg:border-r lg:border-white/10 lg:pr-6">
            <Link to="/" className="flex flex-col items-start gap-4 group">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-secondary/30 blur-lg scale-125 group-hover:bg-secondary/40 transition-colors" />
                <div className="relative bg-white p-2 rounded-full shadow-lg ring-1 ring-white/10">
                  <img
                    src={logo}
                    alt="Lasso Int'l Education Consultancy"
                    className="h-16 w-16 object-contain rounded-full"
                  />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black tracking-tight text-white block leading-none">LASSO</span>
                <span className="text-[10px] block font-bold text-secondary mt-2 tracking-wide uppercase leading-snug whitespace-nowrap">Int'l Education Consultancy</span>
              </div>
            </Link>

            {socialItems.length > 0 && (
              <div className="flex items-center gap-3">
                {socialItems.map(({ key, url, Icon, label }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-secondary flex items-center justify-center transition-colors duration-200"
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* About Us */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-5">About Us</h4>
            <div className="space-y-4">
              {aboutUs.tagline && (
                <p className="border-l-2 border-secondary/50 pl-4 text-white/90 text-sm font-medium italic leading-relaxed">
                  "{aboutUs.tagline}"
                </p>
              )}

              {aboutUs.description && (
                <p className="text-gray-400 text-sm leading-relaxed">
                  {aboutUs.description}
                </p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/countries" className="hover:text-white transition-colors">Explore Countries</Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">Our Services</Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">Seminars & Workshops</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Get in Touch</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-5">Contact Us</h4>
            <ul className="space-y-3.5 text-sm text-gray-400">
              {contactInfo.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-white shrink-0 mt-0.5" />
                  <span>{contactInfo.address}</span>
                </li>
              )}
              {contactInfo.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-white shrink-0" />
                  <a href={`tel:${contactInfo.phone}`} className="hover:text-white transition-colors">{contactInfo.phone}</a>
                </li>
              )}
              {contactInfo.email && (
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-white shrink-0" />
                  <a href={`mailto:${contactInfo.email}`} className="hover:text-white transition-colors">{contactInfo.email}</a>
                </li>
              )}
            </ul>
          </div>

          {/* Office Hours */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-5">Office Hours</h4>
            <ul className="space-y-3.5 text-sm text-gray-400">
              {officeHours.map((entry, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Clock className={`w-5 h-5 shrink-0 mt-0.5 ${entry.closed ? 'text-white/30' : 'text-white'}`} />
                  <div>
                    <p className={`font-semibold ${entry.closed ? 'text-gray-500' : 'text-white'}`}>{entry.days}</p>
                    <p className={`text-xs ${entry.closed ? 'text-gray-500' : 'text-gray-400'}`}>{entry.hours}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>

        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {currentYear} Lasso Consultancy. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
