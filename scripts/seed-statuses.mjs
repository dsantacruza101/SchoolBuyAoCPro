/**
 * seed-statuses.mjs
 *
 * Seeds the 6 system statuses into /schools/aoc/statuses/ and a starter
 * set of 4 categories into /schools/aoc/categories/.
 *
 * Run this once after the school document has been created.
 *
 * Prerequisites:
 *   scripts/serviceAccount.json must exist (gitignored).
 *
 * Usage:
 *   node scripts/seed-statuses.mjs
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, 'serviceAccount.json'), 'utf8'),
);

const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const db = admin.firestore();
const SCHOOL_ID = 'aoc';
const now = admin.firestore.FieldValue.serverTimestamp();

// ── System statuses ──────────────────────────────────────────────────────────

const SYSTEM_STATUSES = [
  { code: 'pending',       label: 'Pending',       color: '#f59e0b', isTerminal: false, sortOrder: 1, isSystem: true },
  { code: 'approved',      label: 'Approved',      color: '#10b981', isTerminal: false, sortOrder: 2, isSystem: true },
  { code: 'auto-approved', label: 'Auto-Approved', color: '#6366f1', isTerminal: false, sortOrder: 3, isSystem: true },
  { code: 'ordered',       label: 'Ordered',       color: '#3b82f6', isTerminal: false, sortOrder: 4, isSystem: true },
  { code: 'received',      label: 'Received',      color: '#22c55e', isTerminal: true,  sortOrder: 5, isSystem: true },
  { code: 'denied',        label: 'Denied',        color: '#ef4444', isTerminal: true,  sortOrder: 6, isSystem: true },
];

// ── Starter categories ───────────────────────────────────────────────────────

const STARTER_CATEGORIES = [
  { code: 'art-supplies',  label: 'Art Supplies',  color: '#f97316', sortOrder: 1 },
  { code: 'technology',    label: 'Technology',    color: '#3b82f6', sortOrder: 2 },
  { code: 'stationery',   label: 'Stationery',    color: '#8b5cf6', sortOrder: 3 },
  { code: 'books',         label: 'Books',         color: '#10b981', sortOrder: 4 },
];

// ── Write ────────────────────────────────────────────────────────────────────

const batch = db.batch();

for (const status of SYSTEM_STATUSES) {
  const ref = db.doc(`schools/${SCHOOL_ID}/statuses/${status.code}`);
  batch.set(ref, {
    ...status,
    active: true,
    createdAt: now,
    updatedAt: now,
    updatedByUid: null,
    deletedAt: null,
    deletedByUid: null,
  });
}

for (const cat of STARTER_CATEGORIES) {
  const ref = db.doc(`schools/${SCHOOL_ID}/categories/${cat.code}`);
  batch.set(ref, {
    ...cat,
    active: true,
    createdAt: now,
    updatedAt: now,
    updatedByUid: null,
    deletedAt: null,
    deletedByUid: null,
  });
}

await batch.commit();

console.log(`✅  Seeded ${SYSTEM_STATUSES.length} statuses into /schools/${SCHOOL_ID}/statuses/`);
SYSTEM_STATUSES.forEach(s => console.log(`   • ${s.code}${s.isTerminal ? ' (terminal)' : ''}`));

console.log(`\n✅  Seeded ${STARTER_CATEGORIES.length} categories into /schools/${SCHOOL_ID}/categories/`);
STARTER_CATEGORIES.forEach(c => console.log(`   • ${c.code}`));

await admin.app().delete();
