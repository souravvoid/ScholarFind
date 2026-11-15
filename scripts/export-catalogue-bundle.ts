/**
 * Export the bundled TypeScript catalogue to the JSON fixture the Django
 * backend imports.
 *
 * Run this after editing `src/data/scholarshipsData.ts` so the API and the
 * offline fallback stay on the same records:
 *
 *   npx tsx scripts/export-catalogue-bundle.ts
 *
 * Then load the fixture into PostgreSQL:
 *
 *   cd backend && python manage.py seed_catalogue_bundle
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCHOLARSHIPS_DATA } from '../src/data/scholarshipsData';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '../backend/scholarships/fixtures/bundled_catalogue.json');

mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(SCHOLARSHIPS_DATA, null, 2)}\n`);

console.log(`Wrote ${SCHOLARSHIPS_DATA.length} scholarships to ${target}`);
