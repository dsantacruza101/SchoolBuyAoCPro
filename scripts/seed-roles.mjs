/**
 * seed-roles.mjs
 *
 * Seeds the five system roles into /schools/aoc/roles/ with the correct
 * schema (capabilities[], name, isSystem, sortOrder, memberCount).
 *
 * Run this once after deleting the old top-level `roles` collection.
 *
 * Prerequisites:
 *   scripts/serviceAccount.json must exist (gitignored).
 *
 * Usage:
 *   node scripts/seed-roles.mjs
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

/** @type {Array<{id: string, data: object}>} */
const SYSTEM_ROLES = [
  {
    id: 'admin',
    data: {
      code: 'admin',
      name: 'Administrator',
      description: 'Full access to every feature and capability.',
      isSystem: true,
      sortOrder: 10,
      memberCount: 0,
      capabilities: [
        'requests.view', 'requests.create', 'requests.editOwn',
        'requests.editAny', 'requests.approve', 'requests.delete',
        'requests.markOrdered', 'requests.markReceived',
        'budgets.view', 'budgets.edit', 'budgets.allocate',
        'budgets.adjust', 'budgets.approve',
        'departments.manage', 'vendors.manage', 'staff.manage',
        'grades.manage', 'events.view', 'events.manage', 'events.spend',
        'categories.manage', 'statuses.manage',
        'settings.edit', 'audit.view', 'reports.export',
        'users.invite', 'users.disable', 'roles.manage',
      ],
    },
  },
  {
    id: 'principal',
    data: {
      code: 'principal',
      name: 'Principal',
      description: 'Approves requests, manages staff, views all budgets and reports.',
      isSystem: true,
      sortOrder: 20,
      memberCount: 0,
      capabilities: [
        'requests.view', 'requests.create', 'requests.editOwn',
        'requests.editAny', 'requests.approve',
        'requests.markOrdered', 'requests.markReceived',
        'budgets.view', 'budgets.edit', 'budgets.allocate',
        'budgets.adjust', 'budgets.approve',
        'staff.manage', 'events.view', 'events.manage', 'events.spend',
        'audit.view', 'reports.export',
      ],
    },
  },
  {
    id: 'ap',
    data: {
      code: 'ap',
      name: 'Assistant Principal',
      description: 'Approves requests and adjusts budgets within their purview.',
      isSystem: true,
      sortOrder: 30,
      memberCount: 0,
      capabilities: [
        'requests.view', 'requests.create', 'requests.editOwn',
        'requests.editAny', 'requests.approve',
        'requests.markOrdered', 'requests.markReceived',
        'budgets.view', 'budgets.adjust',
        'events.view', 'events.manage', 'events.spend',
        'audit.view', 'reports.export',
      ],
    },
  },
  {
    id: 'staff',
    data: {
      code: 'staff',
      name: 'Teacher / Staff',
      description: 'Submits and tracks their own purchase requests.',
      isSystem: true,
      sortOrder: 40,
      memberCount: 0,
      capabilities: [
        'requests.view', 'requests.create', 'requests.editOwn',
        'budgets.view', 'events.view', 'events.spend',
      ],
    },
  },
  {
    id: 'viewer',
    data: {
      code: 'viewer',
      name: 'Read-only Viewer',
      description: 'Can view requests and budgets but cannot create or modify anything.',
      isSystem: true,
      sortOrder: 50,
      memberCount: 0,
      capabilities: [
        'requests.view', 'budgets.view', 'events.view',
      ],
    },
  },
];

const now = admin.firestore.FieldValue.serverTimestamp();

const batch = db.batch();

for (const role of SYSTEM_ROLES) {
  const ref = db.doc(`schools/${SCHOOL_ID}/roles/${role.id}`);
  batch.set(ref, { ...role.data, createdAt: now, updatedAt: now, updatedByUid: null });
}

await batch.commit();

console.log(`✅  Seeded ${SYSTEM_ROLES.length} system roles into /schools/${SCHOOL_ID}/roles/`);
SYSTEM_ROLES.forEach(r => console.log(`   • ${r.id} (${r.data.capabilities.length} caps)`));

await admin.app().delete();
