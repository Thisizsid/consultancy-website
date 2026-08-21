/**
 * One-time migration: converts the legacy emoji `flag` field on existing
 * `countries` rows to a `flagCode` (ISO 3166-1 alpha-2, or "EU") field.
 *
 * The seed defaults in config/db.js only run against an empty table, so a
 * database that was already seeded before this change keeps the old emoji
 * field forever unless migrated explicitly. Safe to re-run: rows that
 * already have flagCode, or whose flag emoji isn't recognized, are skipped
 * and reported so they can be fixed by hand in the CMS.
 *
 * Usage (from the server/ directory):
 *   node scripts/migrate-country-flags.js
 */
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Regional indicator symbol pairs -> ISO code, plus the EU pseudo-flag
const EMOJI_TO_CODE = {
  '🇦🇺': 'AU',
  '🇨🇦': 'CA',
  '🇬🇧': 'GB',
  '🇺🇸': 'US',
  '🇳🇿': 'NZ',
  '🇪🇺': 'EU',
  '🇮🇪': 'IE',
  '🇩🇪': 'DE',
  '🇫🇷': 'FR',
  '🇳🇱': 'NL',
  '🇸🇬': 'SG',
  '🇯🇵': 'JP',
  '🇰🇷': 'KR',
  '🇦🇪': 'AE',
  '🇲🇾': 'MY',
  '🇨🇭': 'CH',
  '🇸🇪': 'SE',
  '🇮🇹': 'IT',
  '🇪🇸': 'ES',
  '🇮🇳': 'IN',
};

const db = new sqlite3.Database(path.resolve(__dirname, '..', 'database.sqlite'));

db.all('SELECT id, data FROM countries', [], (err, rows) => {
  if (err) {
    console.error('Failed to read countries table:', err.message);
    process.exit(1);
  }

  let migrated = 0;
  let alreadyDone = 0;
  const unresolved = [];
  let pending = rows.length;

  if (pending === 0) {
    console.log('No countries found — nothing to migrate.');
    db.close();
    return;
  }

  rows.forEach((row) => {
    const doc = JSON.parse(row.data);

    if (doc.flagCode) {
      alreadyDone++;
      if (--pending === 0) finish();
      return;
    }

    const code = doc.flag ? EMOJI_TO_CODE[doc.flag] : undefined;
    if (!code) {
      unresolved.push({ id: row.id, name: doc.name, flag: doc.flag });
      if (--pending === 0) finish();
      return;
    }

    const { flag, ...rest } = doc; // eslint-disable-line no-unused-vars -- drop the legacy emoji field
    const updated = { ...rest, flagCode: code };

    db.run('UPDATE countries SET data = ? WHERE id = ?', [JSON.stringify(updated), row.id], (updateErr) => {
      if (updateErr) {
        console.error(`Failed to update ${doc.name}:`, updateErr.message);
      } else {
        migrated++;
        console.log(`Migrated ${doc.name}: ${flag} -> ${code}`);
      }
      if (--pending === 0) finish();
    });
  });

  function finish() {
    console.log(`\nDone. Migrated: ${migrated}, already had flagCode: ${alreadyDone}, unresolved: ${unresolved.length}`);
    if (unresolved.length) {
      console.log('Set these manually in the CMS (unrecognized or missing flag emoji):');
      unresolved.forEach((u) => console.log(`  - ${u.name} (id: ${u.id}, flag: ${u.flag || '(none)'})`));
    }
    db.close();
  }
});
