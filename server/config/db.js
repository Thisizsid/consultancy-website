import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const COLLECTIONS = [
  'countries',
  'services',
  'testimonials',
  'events',
  'partners',
  'branches',
  'enquiries',
  'gallery',
  'settings',
  'users'
];

const SETTINGS_DOC_ID = 'site_settings';

const defaultSiteSettings = {
  aboutUs: {
    tagline: 'Connecting Students to Global Opportunities',
    description: 'Lasso Consultancy is a premier study abroad counseling platform helping students gain admission and visa approvals for top global education hubs.',
  },
  contactInfo: {
    address: '102 Premium Plaza, Parliament Road, Kathmandu, Nepal',
    phone: '+977 1-4433221',
    email: 'info@lassoconsultancy.com',
  },
  officeHours: [
    { days: 'Sunday - Friday', hours: '9:00 AM - 6:00 PM', closed: false },
    { days: 'Saturday', hours: 'Closed', closed: true },
  ],
};

// Seed Data
const defaultCountries = [
  {
    name: 'Australia',
    slug: 'australia',
    flagCode: 'AU',
    image: 'https://images.unsplash.com/photo-1523482596682-cd93a6e54520?w=800&auto=format&fit=crop&q=60',
    description: 'World-class education system, vibrant multicultural cities, and attractive post-study work opportunities.',
    popularCourses: 'Engineering, Information Technology, Nursing, Business Administration',
    tuitionFees: 'AUD 20,000 - 45,000 / year',
    livingCost: 'AUD 21,041 / year',
    visaProcess: 'Simplified Student Visa Framework (Subclass 500). Requires confirmation of enrollment (CoE), financial proof, and English proficiency.',
    visible: true
  },
  {
    name: 'Canada',
    slug: 'canada',
    flagCode: 'CA',
    image: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?w=800&auto=format&fit=crop&q=60',
    description: 'High academic standards, safe welcoming environments, and extensive pathways to permanent residency.',
    popularCourses: 'Computer Science, Data Science, MBA, Hospitality Management, Health Sciences',
    tuitionFees: 'CAD 15,000 - 35,000 / year',
    livingCost: 'CAD 15,000 / year',
    visaProcess: 'Study Permit application. Requires Letter of Acceptance (LOA), Guaranteed Investment Certificate (GIC), and biometrics.',
    visible: true
  },
  {
    name: 'United Kingdom',
    slug: 'uk',
    flagCode: 'GB',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ca1ad?w=800&auto=format&fit=crop&q=60',
    description: 'Rich historical heritage, prestigious world-ranked universities, and intensive 1-year Master\'s degrees.',
    popularCourses: 'Finance & Banking, Medicine, International Law, Fine Arts, STEM fields',
    tuitionFees: 'GBP 12,000 - 30,000 / year',
    livingCost: 'GBP 12,180 / year',
    visaProcess: 'Student Visa (formerly Tier 4). Point-based system requiring a Confirmation of Acceptance for Studies (CAS) and meeting financial criteria.',
    visible: true
  },
  {
    name: 'United States',
    slug: 'usa',
    flagCode: 'US',
    image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&auto=format&fit=crop&q=60',
    description: 'Home to the Ivy League, leading research infrastructure, and extensive Optional Practical Training (OPT) programs.',
    popularCourses: 'STEM Courses, Business Analytics, Artificial Intelligence, Creative Writing',
    tuitionFees: 'USD 25,000 - 55,000 / year',
    livingCost: 'USD 18,000 / year',
    visaProcess: 'F-1 Student Visa. Requires Form I-20 from a certified university, SEVIS fee payment, and an in-person visa interview.',
    visible: true
  },
  {
    name: 'New Zealand',
    slug: 'new-zealand',
    flagCode: 'NZ',
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=60',
    description: 'Stunning landscapes, relaxed lifestyle, highly supportive learning environments, and strong visa success.',
    popularCourses: 'Agricultural Studies, Environmental Science, Aviation, Engineering',
    tuitionFees: 'NZD 22,000 - 38,000 / year',
    livingCost: 'NZD 20,000 / year',
    visaProcess: 'Student Visa. Requires offer of place, tuition fee payment receipt, and proof of funds to support yourself.',
    visible: true
  },
  {
    name: 'Europe',
    slug: 'europe',
    flagCode: 'EU',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=60',
    description: 'Rich cultural exposure, affordable or tuition-free universities (e.g. Germany), and travel freedom.',
    popularCourses: 'Automotive Engineering, Fashion Design, International Relations, Renewable Energy',
    tuitionFees: 'EUR 0 - 15,000 / year',
    livingCost: 'EUR 10,000 / year',
    visaProcess: 'National D Visa. Process varies by country but generally requires proof of university enrollment, block accounts (Germany), or insurance.',
    visible: true
  }
];

const defaultServices = [
  {
    title: 'Counseling',
    description: 'Personalized guidance sessions to align your career goals, budget, and talents with the right destinations.',
    icon: 'Compass'
  },
  {
    title: 'University Selection',
    description: 'Expert matching based on academic credentials, language scores, and tuition targets to find your ideal fit.',
    icon: 'School'
  },
  {
    title: 'Application Assistance',
    description: 'Precise assistance with college applications, ensuring complete portfolios, application fee waivers, and submissions.',
    icon: 'FileText'
  },
  {
    title: 'Visa Guidance',
    description: 'Step-by-step interview coaching, financial file compilation, and guidance to maximize visa success rates.',
    icon: 'CheckSquare'
  },
  {
    title: 'SOP Support',
    description: 'In-depth reviews and structural enhancements for your Statement of Purpose (SOP) and Letters of Recommendation.',
    icon: 'Edit3'
  },
  {
    title: 'Scholarship Support',
    description: 'Assisting qualified applicants to obtain merit scholarships, fellowships, and tuition fee discounts.',
    icon: 'Award'
  }
];

const defaultTestimonials = [
  {
    studentName: 'Aarav Adhikari',
    country: 'Canada',
    text: 'Lasso Consultancy handled my profile with utmost care. The SOP edits they provided helped me stand out, and my visa was approved in 3 weeks!',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&auto=format&q=60'
  },
  {
    studentName: 'Elena Rostova',
    country: 'United Kingdom',
    text: 'I received offers from 4 top Russell Group universities. The team guided me in choosing the best scholarship program. Truly professional!',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&auto=format&q=60'
  },
  {
    studentName: 'Marcus Chen',
    country: 'United States',
    text: 'Applying to STEM programs in the US seemed daunting until I visited Lasso. Their advisors walked me through every step from I-20 to F-1 interview.',
    rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format&q=60'
  }
];

const defaultEvents = [
  {
    title: 'Global Education Fair 2026',
    date: '2026-07-20',
    time: '11:00 AM - 5:00 PM',
    description: 'Meet representatives from 50+ universities in Canada, UK, and USA. Get on-the-spot profile evaluation and application fee waivers.',
    location: 'Lasso Corporate Hall & Online Zoom',
    status: 'upcoming'
  },
  {
    title: 'SOP & Resume Writing Workshop',
    date: '2026-08-08',
    time: '2:00 PM - 4:00 PM',
    description: 'Learn how to write a high-scoring Statement of Purpose and format a global-standard academic CV. Live feedback session.',
    location: 'Virtual Classroom (Zoom)',
    status: 'upcoming'
  },
  {
    title: 'Australia Visa Interview Simulation',
    date: '2026-06-01',
    time: '1:00 PM - 3:00 PM',
    description: 'Mock visa interviews and financial documentation audits hosted by former immigration officers. Prepared students for Subclass 500.',
    location: 'Lasso Office, Seminar Room',
    status: 'past'
  }
];

const defaultPartners = [
  {
    name: 'University of Toronto',
    logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&auto=format&fit=crop&q=60'
  },
  {
    name: 'University of Sydney',
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=200&auto=format&fit=crop&q=60'
  },
  {
    name: 'University of Melbourne',
    logo: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=200&auto=format&fit=crop&q=60'
  },
  {
    name: 'King\'s College London',
    logo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=60'
  }
];

export const initDb = () => {
  db.serialize(() => {
    // Collection tables
    COLLECTIONS.forEach((col) => {
      db.run(`CREATE TABLE IF NOT EXISTS ${col} (id TEXT PRIMARY KEY, data TEXT)`);
    });

    // Dedicated admin users table
    db.run(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        token_version INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    // Migration: add token_version to a pre-existing admin_users table that
    // predates it. Every issued JWT embeds the version it was minted with;
    // bumping this column invalidates all outstanding tokens for that user
    // at once (used on password change/reset and explicit logout), which is
    // otherwise impossible with stateless JWTs.
    db.all(`PRAGMA table_info(admin_users)`, (err, columns) => {
      if (err) return console.error('Error reading admin_users schema:', err);
      const hasTokenVersion = columns.some((c) => c.name === 'token_version');
      if (!hasTokenVersion) {
        db.run(`ALTER TABLE admin_users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 0`, (alterErr) => {
          if (alterErr) console.error('Error adding token_version column:', alterErr);
          else console.log('Migrated admin_users: added token_version column');
        });
      }
    });

    // Password reset tokens table
    db.run(`
      CREATE TABLE IF NOT EXISTS reset_tokens (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0
      )
    `);

    // Check & Seed defaults
    const seedTable = (col, defaults) => {
      db.get(`SELECT COUNT(*) as count FROM ${col}`, (err, row) => {
        if (err) return console.error(`Error checking ${col}:`, err);
        if (row && row.count === 0) {
          console.log(`Seeding SQLite table '${col}'...`);
          defaults.forEach((item, index) => {
            const id = `${col}_${index}_${Date.now()}`;
            const dataStr = JSON.stringify({ id, ...item });
            db.run(`INSERT INTO ${col} (id, data) VALUES (?, ?)`, [id, dataStr]);
          });
        }
      });
    };

    seedTable('countries', defaultCountries);
    seedTable('services', defaultServices);
    seedTable('testimonials', defaultTestimonials);
    seedTable('events', defaultEvents);
    seedTable('partners', defaultPartners);

    // Settings is a single fixed-id document rather than a list — seed it directly,
    // and backfill any default keys (e.g. added in a later release) it doesn't have yet.
    db.get(`SELECT id, data FROM settings WHERE id = ?`, [SETTINGS_DOC_ID], (err, row) => {
      if (err) return console.error('Error checking settings:', err);
      if (!row) {
        console.log(`Seeding SQLite table 'settings'...`);
        const dataStr = JSON.stringify({ id: SETTINGS_DOC_ID, ...defaultSiteSettings });
        db.run(`INSERT INTO settings (id, data) VALUES (?, ?)`, [SETTINGS_DOC_ID, dataStr]);
      } else {
        let existing = {};
        try { existing = JSON.parse(row.data); } catch { /* ignore malformed row */ }
        const merged = { ...defaultSiteSettings, ...existing, id: SETTINGS_DOC_ID };
        if (JSON.stringify(merged) !== row.data) {
          db.run(`UPDATE settings SET data = ? WHERE id = ?`, [JSON.stringify(merged), SETTINGS_DOC_ID]);
        }
      }
    });

    // Seed admin user from env vars (only if no admin exists yet)
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    db.get(`SELECT COUNT(*) as count FROM admin_users`, async (err, row) => {
      if (err) return console.error('Error checking admin_users:', err);
      if (row && row.count === 0) {
        // Fail loudly rather than seeding a guessable default like 'admin123'
        if (!adminEmail || !adminPassword) {
          console.error(
            'No admin user exists and ADMIN_EMAIL / ADMIN_PASSWORD are not set in .env.\n' +
            '  Set them and restart to create the initial admin account.'
          );
          return;
        }
        console.log('Creating default admin user...');
        const hash = await bcrypt.hash(adminPassword, 12);
        db.run(
          `INSERT INTO admin_users (id, email, password_hash) VALUES (?, ?, ?)`,
          ['admin_001', adminEmail, hash],
          (err) => {
            if (err) console.error('Error seeding admin user:', err);
            else console.log(`Admin user created: ${adminEmail}`);
          }
        );
      }
    });
  });
};

export const getDb = () => db;
