/**
 * Environment loader — MUST be the first import in index.js.
 *
 * ES module imports are hoisted and evaluated before any statement in the
 * importing module's body. Calling dotenv.config() inside index.js therefore
 * ran *after* ./routes/* and ./middleware/auth.js had already been evaluated,
 * so those modules saw an empty process.env at load time. Importing this
 * module first guarantees .env is populated before anything else reads it.
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env lives at the project root, one level above server/
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const isProd = process.env.NODE_ENV === 'production';

/**
 * Configuration that is merely inconvenient in development but broken in
 * production. Checked at boot so misconfiguration surfaces immediately rather
 * than as a mystery weeks later (e.g. reset emails linking to localhost).
 */
const required = ['JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = required.filter((k) => !process.env[k]);

if (missing.length) {
  const msg = `Missing required environment variables: ${missing.join(', ')}`;
  if (isProd) throw new Error(msg);
  console.warn(`Warning: ${msg}`);
}

if (isProd) {
  const problems = [];

  const frontendUrl = process.env.FRONTEND_URL || '';
  if (!frontendUrl) {
    problems.push('FRONTEND_URL is not set — password reset links will be wrong.');
  } else if (/localhost|127\.0\.0\.1/.test(frontendUrl)) {
    problems.push(
      `FRONTEND_URL points at localhost (${frontendUrl}) — password reset emails ` +
      'would send recipients to their own machine. Set it to the public site URL.'
    );
  }

  if (process.env.JWT_SECRET === 'lasso_super_secret_jwt_key_2026') {
    problems.push('JWT_SECRET is the old hardcoded default. Rotate it.');
  }
  if ((process.env.JWT_SECRET || '').length < 32) {
    problems.push('JWT_SECRET is shorter than 32 characters. Use a long random value.');
  }
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    problems.push('SMTP_USER / SMTP_PASS are not set — password reset emails cannot be sent.');
  }

  if (problems.length) {
    throw new Error(
      'Refusing to start in production with invalid configuration:\n  - ' +
      problems.join('\n  - ')
    );
  }
}
