/**
 * Admin password reset utility.
 *
 * `initDb()` only seeds `admin_users` when the table is empty, so editing
 * ADMIN_PASSWORD in .env has no effect once an admin already exists. This
 * script re-hashes the current .env value onto the existing admin row.
 *
 * Usage (from the server/ directory):
 *   node scripts/reset-admin-password.js
 */
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  process.exit(1);
}

const db = new sqlite3.Database(path.resolve(__dirname, '..', 'database.sqlite'));
const hash = await bcrypt.hash(password, 12);

db.run(
  'UPDATE admin_users SET password_hash = ? WHERE LOWER(email) = LOWER(?)',
  [hash, email.trim()],
  function (err) {
    if (err) {
      console.error('Reset failed:', err.message);
      process.exit(1);
    }
    if (this.changes === 0) {
      console.error(`No admin_users row found for ${email}`);
      process.exit(1);
    }
    console.log(`Password reset for ${email} (${this.changes} row updated)`);
    db.close();
  }
);
