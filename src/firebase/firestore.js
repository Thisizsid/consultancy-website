import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where
} from 'firebase/firestore';
import { db } from './config';

// -------------------------------------------------------------
// TIMEOUT HELPER
// -------------------------------------------------------------
const withTimeout = (promise, ms = 1000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Firebase operation timed out'));
    }, ms);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// -------------------------------------------------------------
// SEED DATA TEMPLATES
// -------------------------------------------------------------
const defaultCountries = [
  {
    name: 'Australia',
    slug: 'australia',
    flag: '🇦🇺',
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
    flag: '🇨🇦',
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
    flag: '🇬🇧',
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
    flag: '🇺🇸',
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
    flag: '🇳🇿',
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
    flag: '🇪🇺',
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

// -------------------------------------------------------------
// LOCAL STORAGE MOCK DB MANAGER (AUTO-FALLBACK TRIGGER)
// -------------------------------------------------------------
let useLocalFallback = false;

const getLocalData = (colName) => {
  const data = localStorage.getItem(`lasso_${colName}`);
  return data ? JSON.parse(data) : [];
};

const setLocalData = (colName, data) => {
  localStorage.setItem(`lasso_${colName}`, JSON.stringify(data));
};

const seedLocalDataIfEmpty = (colName) => {
  const current = getLocalData(colName);
  if (current.length === 0) {
    let defaults = [];
    if (colName === 'countries') defaults = defaultCountries;
    if (colName === 'services') defaults = defaultServices;
    if (colName === 'testimonials') defaults = defaultTestimonials;
    if (colName === 'events') defaults = defaultEvents;
    if (colName === 'partners') defaults = defaultPartners;

    const seeded = defaults.map((item, idx) => ({
      id: `${colName}_${idx}_${Date.now()}`,
      ...item
    }));
    setLocalData(colName, seeded);
  }
};

const triggerLocalFallback = (colName, reason) => {
  if (!useLocalFallback) {
    console.warn(`Firestore failed: ${reason}. Switching to Local Storage Mock DB fallback.`);
    useLocalFallback = true;
  }
  seedLocalDataIfEmpty(colName);
};

// -------------------------------------------------------------
// FIRESTORE CRUD OPERATIONS
// -------------------------------------------------------------

/**
 * Fetch all documents from a collection (seeds if empty, falls back on failure)
 */
export const getAllDocuments = async (colName) => {
  if (useLocalFallback) {
    seedLocalDataIfEmpty(colName);
    return getLocalData(colName);
  }

  try {
    const colRef = collection(db, colName);
    const querySnapshot = await withTimeout(getDocs(colRef), 1000);

    // Seed Firestore if empty
    if (querySnapshot.empty) {
      console.log(`Seeding Firestore '${colName}'...`);
      let defaults = [];
      if (colName === 'countries') defaults = defaultCountries;
      if (colName === 'services') defaults = defaultServices;
      if (colName === 'testimonials') defaults = defaultTestimonials;
      if (colName === 'events') defaults = defaultEvents;
      if (colName === 'partners') defaults = defaultPartners;

      for (const item of defaults) {
        await withTimeout(addDoc(colRef, item), 800);
      }
      // Re-fetch
      const reFetched = await withTimeout(getDocs(colRef), 1000);
      const items = [];
      reFetched.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
      return items;
    }

    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    triggerLocalFallback(colName, error.message);
    return getLocalData(colName);
  }
};

/**
 * Get a single document from a collection by ID
 */
export const getDocumentById = async (colName, docId) => {
  if (useLocalFallback) {
    const data = getLocalData(colName);
    const item = data.find(i => i.id === docId);
    if (item) return item;
    throw new Error(`Item ${docId} not found in local ${colName}`);
  }

  try {
    const docRef = doc(db, colName, docId);
    const docSnap = await withTimeout(getDoc(docRef), 1000);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error(`Document ${docId} not found in Firestore ${colName}`);
  } catch (error) {
    triggerLocalFallback(colName, error.message);
    const data = getLocalData(colName);
    const item = data.find(i => i.id === docId);
    if (item) return item;
    throw error;
  }
};

/**
 * Get country profile by Slug
 */
export const getCountryBySlug = async (slug) => {
  if (useLocalFallback) {
    seedLocalDataIfEmpty('countries');
    const data = getLocalData('countries');
    const item = data.find(c => c.slug === slug);
    if (item) return item;
    throw new Error(`Country ${slug} not found locally.`);
  }

  try {
    const q = query(collection(db, 'countries'), where('slug', '==', slug));
    const querySnapshot = await withTimeout(getDocs(q), 1000);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error(`Country slug '${slug}' not found.`);
  } catch (error) {
    triggerLocalFallback('countries', error.message);
    const data = getLocalData('countries');
    const item = data.find(c => c.slug === slug);
    if (item) return item;
    throw error;
  }
};

/**
 * Create a new document
 */
export const createDocument = async (colName, data) => {
  if (useLocalFallback) {
    const local = getLocalData(colName);
    const newDoc = { id: `${colName}_${Date.now()}`, ...data };
    local.push(newDoc);
    setLocalData(colName, local);
    return newDoc;
  }

  try {
    const docRef = await withTimeout(addDoc(collection(db, colName), data), 1200);
    return { id: docRef.id, ...data };
  } catch (error) {
    triggerLocalFallback(colName, error.message);
    const local = getLocalData(colName);
    const newDoc = { id: `${colName}_${Date.now()}`, ...data };
    local.push(newDoc);
    setLocalData(colName, local);
    return newDoc;
  }
};

/**
 * Update a document
 */
export const updateDocument = async (colName, docId, data) => {
  if (useLocalFallback) {
    const local = getLocalData(colName);
    const idx = local.findIndex(i => i.id === docId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...data };
      setLocalData(colName, local);
      return;
    }
    throw new Error(`Local item ${docId} not found to update.`);
  }

  try {
    const docRef = doc(db, colName, docId);
    await withTimeout(updateDoc(docRef, data), 1200);
  } catch (error) {
    triggerLocalFallback(colName, error.message);
    const local = getLocalData(colName);
    const idx = local.findIndex(i => i.id === docId);
    if (idx !== -1) {
      local[idx] = { ...local[idx], ...data };
      setLocalData(colName, local);
    }
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (colName, docId) => {
  if (useLocalFallback) {
    const local = getLocalData(colName);
    const filtered = local.filter(i => i.id !== docId);
    setLocalData(colName, filtered);
    return;
  }

  try {
    const docRef = doc(db, colName, docId);
    await withTimeout(deleteDoc(docRef), 1200);
  } catch (error) {
    triggerLocalFallback(colName, error.message);
    const local = getLocalData(colName);
    const filtered = local.filter(i => i.id !== docId);
    setLocalData(colName, filtered);
  }
};
