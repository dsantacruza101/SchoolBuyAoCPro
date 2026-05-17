/**
 * set-admin-claims.mjs
 *
 * One-time dev script that grants a Firebase Auth user the full admin
 * capability set for the "aoc" school. Run this once for your own UID
 * so the roleGuard lets you reach the dashboard during US-002 testing.
 *
 * Production claim management is handled by the `syncRoleClaims` Cloud
 * Function (US-003). This script is for local development only.
 *
 * Prerequisites:
 *   1. Download a service account key from:
 *      Firebase Console → Project Settings → Service accounts → Generate new private key
 *   2. Save it as scripts/serviceAccount.json  (gitignored — never commit it)
 *   3. Install the admin SDK once:
 *      npm install --save-dev firebase-admin
 *
 * Usage:
 *   node scripts/set-admin-claims.mjs <firebase-uid>
 *
 * Your UID is in Firebase Console → Authentication → Users (User UID column).
 *
 * After running: sign out and sign back in so Firebase issues a fresh token
 * containing the new claims.
 */

import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Validate args ─────────────────────────────────────────────────────────────

const uid = process.argv[2];

if (!uid) {
  console.error('Usage: node scripts/set-admin-claims.mjs <firebase-uid>');
  console.error('Your UID is in Firebase Console → Authentication → Users.');
  process.exit(1);
}

// ── Load service account ──────────────────────────────────────────────────────

const serviceAccountPath = resolve(__dirname, 'serviceAccount.json');
console.log('service path: ', serviceAccountPath);

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch {
  console.error('❌  Could not read scripts/serviceAccount.json');
  console.error('   Download it from: Firebase Console → Project Settings → Service accounts');
  process.exit(1);
}

// ── Full admin capability set (master plan §6) ────────────────────────────────

/** @type {string[]} */
const ADMIN_CAPS = [
  'requests.view',        'requests.create',       'requests.editOwn',
  'requests.editAny',     'requests.approve',      'requests.delete',
  'requests.markOrdered', 'requests.markReceived',
  'budgets.view',         'budgets.edit',          'budgets.allocate',
  'budgets.adjust',       'budgets.approve',
  'departments.manage',   'vendors.manage',         'staff.manage',
  'grades.manage',        'events.view',            'events.manage',
  'events.spend',         'categories.manage',      'statuses.manage',
  'settings.edit',        'audit.view',             'reports.export',
  'users.invite',         'users.disable',          'roles.manage',
];

const SCHOOL_ID = 'aoc';

const customClaims = {
  schools: {
    [SCHOOL_ID]: {
      role: 'admin',
      caps: ADMIN_CAPS,
    },
  },
};

// ── Set claims ────────────────────────────────────────────────────────────────

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

try {
  await admin.auth().setCustomUserClaims(uid, customClaims);
  console.log(`✅  Admin claims set on UID: ${uid}`);
  console.log(`   School: ${SCHOOL_ID}  |  Role: admin  |  Caps: ${ADMIN_CAPS.length}`);
  console.log('');
  console.log('   Sign out and sign back in to receive a fresh JWT token.');
} catch (err) {
  console.error('❌  Failed to set custom claims:', err.message);
  process.exit(1);
} finally {
  await admin.app().delete();
}
