import { z } from 'zod';

/**
 * Server-side mirror of the Zod schemas already enforced client-side in each
 * admin/*CMS page. Client validation is UX only — any caller can skip it and
 * POST/PUT directly against the API, so every collection needs its own
 * check here too. `.strict()` additionally rejects unrecognized keys, which
 * closes off arbitrary-field injection (e.g. a client trying to smuggle in
 * `__proto__`, or fields belonging to a different collection's shape).
 *
 * Each entry has an optional `create` schema (used by POST) and `update`
 * schema (used by PUT — `.partial()` of the same shape, since the admin UI
 * sends partial updates like `{ visible }` or `{ status }`). A collection
 * with no entry here falls back to no server-side shape validation.
 */

const url = () => z.string().trim().url().or(z.literal(''));

const countrySchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).regex(/^[a-z0-9-]+$/),
  image: url(),
  description: z.string().trim().min(10).max(5000),
  popularCourses: z.string().trim().min(2).max(1000),
  tuitionFees: z.string().trim().min(2).max(300),
  livingCost: z.string().trim().min(2).max(300),
  visaProcess: z.string().trim().min(5).max(5000),
  visible: z.boolean(),
}).strict();

const serviceSchema = z.object({
  title: z.string().trim().min(2).max(200),
  icon: z.enum(['Compass', 'School', 'FileText', 'CheckSquare', 'Edit3', 'Award']),
  description: z.string().trim().min(10).max(2000),
}).strict();

const testimonialSchema = z.object({
  studentName: z.string().trim().min(2).max(200),
  country: z.string().trim().min(2).max(200),
  text: z.string().trim().min(10).max(3000),
  rating: z.coerce.number().int().min(1).max(5),
  image: url(),
}).strict();

const eventSchema = z.object({
  title: z.string().trim().min(2).max(200),
  date: z.string().trim().min(1).max(50),
  time: z.string().trim().min(1).max(100),
  description: z.string().trim().min(10).max(3000),
  location: z.string().trim().min(2).max(300),
  status: z.enum(['upcoming', 'past']),
}).strict();

const partnerSchema = z.object({
  name: z.string().trim().min(2).max(200),
  logo: url(),
}).strict();

const branchSchema = z.object({
  name: z.string().trim().min(2).max(200),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(6).max(50),
  email: z.string().trim().email().max(320),
  openingHours: z.string().trim().min(3).max(300),
  status: z.enum(['active', 'inactive']),
}).strict();

const gallerySchema = z.object({
  caption: z.string().trim().min(2).max(300),
  category: z.enum(['Office', 'Events', 'Students', 'Seminars', 'Other']),
  imageUrl: url(),
  createdAt: z.string().trim().optional(),
}).strict();

const officeHourEntry = z.object({
  days: z.string().trim().min(1).max(100),
  hours: z.string().trim().min(1).max(100),
  closed: z.boolean(),
}).strict();

const settingsSchema = z.object({
  aboutUs: z.object({
    tagline: z.string().trim().min(1).max(300),
    description: z.string().trim().min(1).max(2000),
  }).strict().partial(),
  contactInfo: z.object({
    address: z.string().trim().min(1).max(500),
    phone: z.string().trim().min(1).max(50),
    email: z.string().trim().email().max(320),
  }).strict().partial(),
  officeHours: z.array(officeHourEntry).max(20),
  socialLinks: z.object({
    facebook: url(),
    instagram: url(),
    tiktok: url(),
  }).strict().partial(),
}).strict().partial();

// Public write path (the contact/enquiry forms) — deliberately narrow.
// `status`, `createdAt` and `notes` are accepted here only because the
// current frontend always includes them in the request body; the route
// handler overwrites all three server-side regardless of what's submitted,
// so a caller cannot backdate a lead or pre-set its status via this field.
const enquiryCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(6).max(50),
  country: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(3000),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  notes: z.string().optional(),
}).strict();

// Admin-only update path (status changes, note-taking) — separate from the
// public create schema above since the accepted fields differ entirely.
const enquiryUpdateSchema = z.object({
  status: z.enum(['new', 'contacted', 'converted', 'closed']),
  notes: z.string().trim().max(5000),
}).strict().partial();

const SCHEMAS = {
  countries: { create: countrySchema, update: countrySchema.partial() },
  services: { create: serviceSchema, update: serviceSchema.partial() },
  testimonials: { create: testimonialSchema, update: testimonialSchema.partial() },
  events: { create: eventSchema, update: eventSchema.partial() },
  partners: { create: partnerSchema, update: partnerSchema.partial() },
  branches: { create: branchSchema, update: branchSchema.partial() },
  gallery: { create: gallerySchema, update: gallerySchema.partial() },
  settings: { create: settingsSchema, update: settingsSchema },
  enquiries: { create: enquiryCreateSchema, update: enquiryUpdateSchema },
};

export const getCreateSchema = (collection) => SCHEMAS[collection]?.create;
export const getUpdateSchema = (collection) => SCHEMAS[collection]?.update;

/** Formats a ZodError into a compact, client-safe list of field issues. */
export const formatZodError = (zodError) =>
  zodError.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }));
