#!/usr/bin/env node
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import process from 'process';
import admin from 'firebase-admin';

function loadServiceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  const filePath = process.env.SERVICE_ACCOUNT_KEY_PATH;
  if (b64) {
    try {
      const json = Buffer.from(b64, 'base64').toString('utf8');
      return JSON.parse(json);
    } catch (e) {
      throw new Error('Failed to parse FIREBASE_SERVICE_ACCOUNT (base64 JSON)');
    }
  }
  if (filePath) {
    const resolved = path.resolve(filePath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`SERVICE_ACCOUNT_KEY_PATH not found: ${resolved}`);
    }
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  }
  throw new Error('Provide FIREBASE_SERVICE_ACCOUNT (base64) or SERVICE_ACCOUNT_KEY_PATH');
}

async function main() {
  const sa = loadServiceAccount();
  const projectId = process.env.FIREBASE_PROJECT_ID || sa.project_id;
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`;

  if (!projectId) throw new Error('Missing FIREBASE_PROJECT_ID and project_id from service account');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      storageBucket,
    });
  }

  const db = admin.firestore();
  const now = new Date().toISOString();

  // Collections required by the app
  const collections = [
    'user_profiles',
    'clients',
    'matters',
    'matters_meta',
    'hearings',
    'documents',
    'document_templates',
    'document_versions',
    'deadlines',
    'deadline_notes',
    'time_entries',
    'tasks',
    'invoices',
    'payments',
    'communications',
    'notifications',
  ];

  async function ensureCollection(name) {
    const snap = await db.collection(name).limit(1).get();
    if (snap.empty) {
      await db.collection(name).doc('__init__').set({ created_at: now, note: 'initialized by seed script' });
      // delete marker to keep collection clean
      await db.collection(name).doc('__init__').delete();
    }
  }

  for (const c of collections) {
    await ensureCollection(c);
  }

  // Minimal sample data to verify UI end-to-end
  const clientRef = await db.collection('clients').add({
    first_name: 'Sample',
    last_name: 'Client',
    email: 'sample@example.com',
    created_at: now,
    updated_at: now,
  });

  const matterRef = await db.collection('matters').add({
    title: 'Sample Matter',
    matter_number: 'M-0001',
    practice_area: 'Criminal',
    status: 'Open',
    client_id: clientRef.id,
    created_at: now,
    updated_at: now,
  });

  await db.collection('deadlines').add({
    matter_id: matterRef.id,
    title: 'File initial paperwork',
    source: 'Manual',
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Open',
    created_at: now,
    updated_at: now,
  });

  console.log('Firestore collections ensured and sample data created.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


