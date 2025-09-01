#!/usr/bin/env node

// Seed minimal test data for sample scenarios
// Creates (idempotent):
// - Client: john.doe+sample@example.com
// - Matter: TEST-0001 (title: Test Matter) linked to the client
// - Template: "Engagement Letter" with variables ["client_name","case_number"]
//
// Usage:
//   APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1 \
//   APPWRITE_PROJECT_ID=YOUR_PROJECT_ID \
//   APPWRITE_API_KEY=YOUR_API_KEY \
//   node scripts/appwrite/seed-sample-data.mjs

import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const sdk = require('node-appwrite');

const { Client, Databases, ID, Query } = sdk;

// Load .env.local or .env into process.env (simple loader)
function loadEnv() {
  const root = process.cwd();
  for (const fname of ['.env.local', '.env']) {
    const p = path.join(root, fname);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith('\'') && val.endsWith('\''))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

async function main() {
  loadEnv();

  const ENDPOINT = reqEnv('APPWRITE_ENDPOINT');
  const PROJECT_ID = reqEnv('APPWRITE_PROJECT_ID');
  const API_KEY = reqEnv('APPWRITE_API_KEY');

  const DATABASE_ID = 'jusivo';
  const COL = {
    clients: 'clients',
    matters: 'matters',
    templates: 'document_templates',
  };

  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const databases = new Databases(client);

  const TEST = {
    email: 'john.doe+sample@example.com',
    matterNumber: 'TEST-0001',
    templateName: 'Engagement Letter',
  };

  console.log('Seeding sample data...');

  // 1) Ensure client
  let clientDoc = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL.clients, [Query.equal('email', TEST.email)]);
    clientDoc = res.documents?.[0] || null;
  } catch (err) {
    // Older environments: fallback to client-side filter
    const res = await databases.listDocuments(DATABASE_ID, COL.clients, []);
    clientDoc = (res.documents || []).find((d) => (d.email || d.email) === TEST.email) || null;
  }

  if (!clientDoc) {
    console.log('Creating client...');
    clientDoc = await databases.createDocument(DATABASE_ID, COL.clients, ID.unique(), {
      first_name: 'John',
      last_name: 'Doe',
      email: TEST.email,
      phone: '555-123-4567',
      preferred_contact_method: 'Email',
      notifications_opt_in: true,
      portal_enabled: true,
    });
  } else {
    console.log('Client already exists:', clientDoc.$id);
  }

  // 2) Ensure matter linked to client
  let matterDoc = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL.matters, [Query.equal('matter_number', TEST.matterNumber)]);
    matterDoc = res.documents?.[0] || null;
  } catch (err) {
    const res = await databases.listDocuments(DATABASE_ID, COL.matters, []);
    matterDoc = (res.documents || []).find((d) => d.matter_number === TEST.matterNumber) || null;
  }

  if (!matterDoc) {
    console.log('Creating matter...');
    matterDoc = await databases.createDocument(DATABASE_ID, COL.matters, ID.unique(), {
      matter_number: TEST.matterNumber,
      title: 'Test Matter',
      practice_area: 'Criminal', // enum: Criminal | PersonalInjury | SSD
      status: 'Open',            // enum: Intake | Open | Pending | Closed
      client_id: clientDoc.$id,
      fee_model: 'FlatRate',     // enum: FlatRate | Progressive
      flat_rate_amount: 0,
      description: 'Seeded for sample scenarios',
    });
  } else {
    console.log('Matter already exists:', matterDoc.$id);
  }

  // 3) Ensure document template
  let templateDoc = null;
  try {
    const res = await databases.listDocuments(DATABASE_ID, COL.templates, [Query.equal('name', TEST.templateName)]);
    templateDoc = res.documents?.[0] || null;
  } catch (err) {
    const res = await databases.listDocuments(DATABASE_ID, COL.templates, []);
    templateDoc = (res.documents || []).find((d) => d.name === TEST.templateName) || null;
  }

  if (!templateDoc) {
    console.log('Creating template...');
    const variables = JSON.stringify(['client_name', 'case_number']);
    const body = 'This Engagement Letter for {{client_name}} regarding case {{case_number}}.\n\nSincerely,\nYour Firm';
    templateDoc = await databases.createDocument(DATABASE_ID, COL.templates, ID.unique(), {
      name: TEST.templateName,
      category: 'General',
      variables, // stored as JSON string; UI parses as array
      body,
      output_type: 'docx',
    });
  } else {
    console.log('Template already exists:', templateDoc.$id);
  }

  console.log('\nSeed complete:');
  console.log('  Client:', clientDoc.$id, clientDoc.email);
  console.log('  Matter:', matterDoc.$id, matterDoc.matter_number);
  console.log('  Template:', templateDoc.$id, templateDoc.name);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err?.message || err);
    process.exit(1);
  });
