#!/usr/bin/env node

// Appwrite setup script: creates database, collections, attributes, indexes, and storage buckets
// Usage:
//   APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1 \
//   APPWRITE_PROJECT_ID=YOUR_PROJECT_ID \
//   APPWRITE_API_KEY=YOUR_API_KEY \
//   node scripts/appwrite/setup.mjs

import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const sdk = require('node-appwrite');

const {
  Client,
  Databases,
  Storage,
  ID,
  Permission,
  Role,
  IndexType,
  RelationshipType,
  RelationMutate,
} = sdk;

// Load .env.local or .env into process.env without adding a dependency
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

async function ensureTimeEntries() {
  await ensureCollection('time_entries', 'Time Entries');
  const list = await databases.listAttributes(DATABASE_ID, 'time_entries');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('matter_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'time_entries', 'matters', RelationshipType.ManyToOne, false, 'matter_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('entry_date'), () => databases.createDatetimeAttribute(DATABASE_ID, 'time_entries', 'entry_date', true));
  pushIfMissing(have.has('hours'), () => databases.createFloatAttribute(DATABASE_ID, 'time_entries', 'hours', true));
  pushIfMissing(have.has('rate'), () => databases.createFloatAttribute(DATABASE_ID, 'time_entries', 'rate', true));
  pushIfMissing(have.has('description'), () => databases.createStringAttribute(DATABASE_ID, 'time_entries', 'description', 2048, false));
  const keys = ['matter_id','entry_date','hours','rate','description'];
  await Promise.all(ops);
  await waitForAttributes('time_entries', keys);
  await ensureIndex('time_entries', 'idx_time_entries_matter', IndexType.Key, ['matter_id']);
  await ensureIndex('time_entries', 'idx_time_entries_entry_date', IndexType.Key, ['entry_date']);
}

async function ensureTasks() {
  await ensureCollection('tasks', 'Tasks');
  const list = await databases.listAttributes(DATABASE_ID, 'tasks');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('matter_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'tasks', 'matters', RelationshipType.ManyToOne, false, 'matter_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('title'), () => databases.createStringAttribute(DATABASE_ID, 'tasks', 'title', 512, true));
  pushIfMissing(have.has('description'), () => databases.createStringAttribute(DATABASE_ID, 'tasks', 'description', 4096, false));
  pushIfMissing(have.has('due_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'tasks', 'due_at', false));
  pushIfMissing(have.has('priority'), () => databases.createEnumAttribute(DATABASE_ID, 'tasks', 'priority', ['Low','Medium','High'], true));
  pushIfMissing(have.has('assignee_ids'), () => databases.createStringAttribute(DATABASE_ID, 'tasks', 'assignee_ids', 64, false, undefined, true));
  pushIfMissing(have.has('status'), () => databases.createEnumAttribute(DATABASE_ID, 'tasks', 'status', ['Open','InProgress','Completed'], true));
  const keys = ['matter_id','title','description','due_at','priority','assignee_ids','status'];
  await Promise.all(ops);
  await waitForAttributes('tasks', keys);
  await ensureIndex('tasks', 'idx_tasks_matter', IndexType.Key, ['matter_id']);
  await ensureIndex('tasks', 'idx_tasks_due_at', IndexType.Key, ['due_at']);
  await ensureIndex('tasks', 'idx_tasks_status', IndexType.Key, ['status']);
}
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

const ENDPOINT = reqEnv('APPWRITE_ENDPOINT');
const PROJECT_ID = reqEnv('APPWRITE_PROJECT_ID');
const API_KEY = reqEnv('APPWRITE_API_KEY');

const DATABASE_ID = 'jusivo';
const BUCKET_DOCUMENTS = 'documents';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);
const storage = new Storage(client);

async function ensureDatabase() {
  try {
    await databases.get(DATABASE_ID);
    console.log(`Database '${DATABASE_ID}' exists`);
  } catch (err) {
    console.log(`Creating database '${DATABASE_ID}'...`);
    await databases.create(DATABASE_ID, 'Jusivo');
    console.log(`Database '${DATABASE_ID}' created`);
  }
}

async function ensureBucketDocuments() {
  try {
    await storage.getBucket(BUCKET_DOCUMENTS);
    // Update to ensure desired settings
    await storage.updateBucket(
      BUCKET_DOCUMENTS,
      'Documents',
      undefined, // permissions
      true, // fileSecurity
      true, // enabled
      undefined, // maximumFileSize
      ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'], // allowedFileExtensions
      'none', // compression
      true, // encryption
      false, // antivirus
    );
    console.log(`Bucket '${BUCKET_DOCUMENTS}' exists; updated settings`);
  } catch {
    console.log(`Creating bucket '${BUCKET_DOCUMENTS}'...`);
    await storage.createBucket(
      BUCKET_DOCUMENTS,
      'Documents',
      undefined, // permissions
      true, // fileSecurity
      true, // enabled
      undefined, // maximumFileSize
      ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png'],
      'none', // compression
      true, // encryption
      false, // antivirus
    );
    console.log(`Bucket '${BUCKET_DOCUMENTS}' created`);
  }
}

async function ensureCollection(collectionId, name, { documentSecurity = true } = {}) {
  try {
    await databases.getCollection(DATABASE_ID, collectionId);
    console.log(`Collection '${collectionId}' exists`);
  } catch {
    console.log(`Creating collection '${collectionId}'...`);
    await databases.createCollection(DATABASE_ID, collectionId, name, [], documentSecurity, true);
    console.log(`Collection '${collectionId}' created`);
  }
}

async function waitForAttributes(collectionId, expectedKeys) {
  const deadline = Date.now() + 60_000; // 60s
  const set = new Set(expectedKeys);
  while (Date.now() < deadline) {
    const list = await databases.listAttributes(DATABASE_ID, collectionId);
    let ok = true;
    for (const key of set) {
      const attr = list.attributes.find((a) => a.key === key);
      if (!attr || attr.status !== 'available') {
        ok = false;
        break;
      }
    }
    if (ok) return;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for attributes on ${collectionId}`);
}

async function ensureIndex(collectionId, key, type, attributes, orders = []) {
  // Avoid attempting indexes on relationship attributes
  const list = await databases.listAttributes(DATABASE_ID, collectionId);
  const attrMap = new Map(list.attributes.map((a) => [a.key, a]));
  const nonRelationship = attributes.filter((k) => attrMap.get(k)?.type !== 'relationship');
  if (nonRelationship.length === 0) {
    console.log(`Skipping index '${key}' on '${collectionId}': only relationship attributes`);
    return;
  }
  try {
    await databases.getIndex(DATABASE_ID, collectionId, key);
    console.log(`Index '${key}' on '${collectionId}' exists`);
  } catch {
    console.log(`Creating index '${key}' on '${collectionId}'...`);
    await databases.createIndex(DATABASE_ID, collectionId, key, type, nonRelationship, orders);
    console.log(`Index '${key}' on '${collectionId}' created`);
  }
}

async function ensureClients() {
  await ensureCollection('clients', 'Clients');
  const list = await databases.listAttributes(DATABASE_ID, 'clients');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('first_name'), () => databases.createStringAttribute(DATABASE_ID, 'clients', 'first_name', 128, true));
  pushIfMissing(have.has('last_name'), () => databases.createStringAttribute(DATABASE_ID, 'clients', 'last_name', 128, true));
  pushIfMissing(have.has('date_of_birth'), () => databases.createDatetimeAttribute(DATABASE_ID, 'clients', 'date_of_birth', false));
  pushIfMissing(have.has('ssn_last4'), () => databases.createStringAttribute(DATABASE_ID, 'clients', 'ssn_last4', 4, false, undefined, false, false));
  pushIfMissing(have.has('email'), () => databases.createEmailAttribute(DATABASE_ID, 'clients', 'email', false));
  // Reduce large string sizes to keep under collection limits
  pushIfMissing(have.has('address'), () => databases.createStringAttribute(DATABASE_ID, 'clients', 'address', 2048, false));
  pushIfMissing(have.has('emergency_contact'), () => databases.createStringAttribute(DATABASE_ID, 'clients', 'emergency_contact', 2048, false));
  pushIfMissing(have.has('preferred_contact_method'), () => databases.createEnumAttribute(DATABASE_ID, 'clients', 'preferred_contact_method', ['Email', 'Phone', 'SMS'], false));
  pushIfMissing(have.has('notifications_opt_in'), () => databases.createBooleanAttribute(DATABASE_ID, 'clients', 'notifications_opt_in', false, true));
  pushIfMissing(have.has('portal_enabled'), () => databases.createBooleanAttribute(DATABASE_ID, 'clients', 'portal_enabled', false, true));
  // Compatibility fields for existing code paths
  pushIfMissing(have.has('mobile_phone'), () => databases.createStringAttribute(DATABASE_ID, 'clients', 'mobile_phone', 32, false));
  pushIfMissing(have.has('home_phone'), () => databases.createStringAttribute(DATABASE_ID, 'clients', 'home_phone', 32, false));
  pushIfMissing(have.has('phone'), () => databases.createStringAttribute(DATABASE_ID, 'clients', 'phone', 32, false));
  const keys = [
    'first_name', 'last_name', 'date_of_birth', 'ssn_last4', 'email', 'address', 'emergency_contact',
    'preferred_contact_method', 'notifications_opt_in', 'portal_enabled', 'mobile_phone', 'home_phone', 'phone'
  ];
  await Promise.all(ops);
  await waitForAttributes('clients', keys);
  await ensureIndex('clients', 'idx_clients_email', IndexType.Unique, ['email']);
}

async function ensureMatters() {
  await ensureCollection('matters', 'Matters');
  const list = await databases.listAttributes(DATABASE_ID, 'matters');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('matter_number'), () => databases.createStringAttribute(DATABASE_ID, 'matters', 'matter_number', 128, true));
  pushIfMissing(have.has('title'), () => databases.createStringAttribute(DATABASE_ID, 'matters', 'title', 512, true));
  pushIfMissing(have.has('practice_area'), () => databases.createEnumAttribute(DATABASE_ID, 'matters', 'practice_area', ['Criminal', 'PersonalInjury', 'SSD'], true));
  pushIfMissing(have.has('status'), () => databases.createEnumAttribute(DATABASE_ID, 'matters', 'status', ['Intake', 'Open', 'Pending', 'Closed'], true));
  pushIfMissing(have.has('client_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'matters', 'clients', RelationshipType.ManyToOne, false, 'client_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('assigned_attorney_ids'), () => databases.createStringAttribute(DATABASE_ID, 'matters', 'assigned_attorney_ids', 64, false, undefined, true));
  pushIfMissing(have.has('opened_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'matters', 'opened_at', false));
  pushIfMissing(have.has('closed_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'matters', 'closed_at', false));
  // Reduce description size to stay under collection attribute limits
  pushIfMissing(have.has('description'), () => databases.createStringAttribute(DATABASE_ID, 'matters', 'description', 2048, false));
  pushIfMissing(have.has('fee_model'), () => databases.createEnumAttribute(DATABASE_ID, 'matters', 'fee_model', ['FlatRate', 'Progressive'], true));
  pushIfMissing(have.has('flat_rate_amount'), () => databases.createFloatAttribute(DATABASE_ID, 'matters', 'flat_rate_amount', false));
  // Store practice-area specific structured data (e.g., Criminal case fields) as JSON string
  pushIfMissing(have.has('case_data'), () => databases.createStringAttribute(DATABASE_ID, 'matters', 'case_data', 8192, false));
  const keys = [
    'matter_number','title','practice_area','status','client_id','assigned_attorney_ids','opened_at','closed_at','description','fee_model','flat_rate_amount','case_data'
  ];
  await Promise.all(ops);
  await waitForAttributes('matters', keys);
  await ensureIndex('matters', 'idx_matters_matter_number', IndexType.Unique, ['matter_number']);
  await ensureIndex('matters', 'idx_matters_client', IndexType.Key, ['client_id']);
  // Indexes for dashboard queries
  await ensureIndex('matters', 'idx_matters_practice_area', IndexType.Key, ['practice_area']);
  await ensureIndex('matters', 'idx_matters_status', IndexType.Key, ['status']);
}

async function ensureDocuments() {
  await ensureCollection('documents', 'Documents');
  const list = await databases.listAttributes(DATABASE_ID, 'documents');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('matter_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'documents', 'matters', RelationshipType.ManyToOne, false, 'matter_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('title'), () => databases.createStringAttribute(DATABASE_ID, 'documents', 'title', 512, true));
  pushIfMissing(have.has('version'), () => databases.createIntegerAttribute(DATABASE_ID, 'documents', 'version', false, null, null, 1));
  pushIfMissing(have.has('created_by'), () => databases.createStringAttribute(DATABASE_ID, 'documents', 'created_by', 128, true));
  pushIfMissing(have.has('status'), () => databases.createEnumAttribute(DATABASE_ID, 'documents', 'status', ['Draft', 'Final'], false));
  pushIfMissing(have.has('template_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'documents', 'document_templates', RelationshipType.ManyToOne, false, 'template_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('file_id'), () => databases.createStringAttribute(DATABASE_ID, 'documents', 'file_id', 128, false));
  pushIfMissing(have.has('file_url'), () => databases.createStringAttribute(DATABASE_ID, 'documents', 'file_url', 2048, false));
  const keys = ['matter_id','title','version','created_by','status','template_id','file_id','file_url'];
  await Promise.all(ops);
  await waitForAttributes('documents', keys);
  await ensureIndex('documents', 'idx_documents_matter', IndexType.Key, ['matter_id']);
}

async function ensureDocumentVersions() {
  await ensureCollection('document_versions', 'Document Versions');
  const list = await databases.listAttributes(DATABASE_ID, 'document_versions');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('document_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'document_versions', 'documents', RelationshipType.ManyToOne, false, 'document_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('version'), () => databases.createIntegerAttribute(DATABASE_ID, 'document_versions', 'version', true));
  pushIfMissing(have.has('created_by'), () => databases.createStringAttribute(DATABASE_ID, 'document_versions', 'created_by', 128, true));
  pushIfMissing(have.has('created_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'document_versions', 'created_at', true));
  pushIfMissing(have.has('changes_summary'), () => databases.createStringAttribute(DATABASE_ID, 'document_versions', 'changes_summary', 1024, false));
  pushIfMissing(have.has('file_url'), () => databases.createStringAttribute(DATABASE_ID, 'document_versions', 'file_url', 2048, false));

  const keys = ['document_id','version','created_by','created_at','changes_summary','file_url'];
  await Promise.all(ops);
  await waitForAttributes('document_versions', keys);
  // Optional index on version for faster sorting/filtering
  await ensureIndex('document_versions', 'idx_doc_versions_version', IndexType.Key, ['version']);
}

async function ensureCommunications() {
  await ensureCollection('communications', 'Communications');
  const list = await databases.listAttributes(DATABASE_ID, 'communications');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('matter_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'communications', 'matters', RelationshipType.ManyToOne, false, 'matter_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('channel'), () => databases.createEnumAttribute(DATABASE_ID, 'communications', 'channel', ['SMS','Email','Phone','Portal'], true));
  pushIfMissing(have.has('direction'), () => databases.createEnumAttribute(DATABASE_ID, 'communications', 'direction', ['Inbound','Outbound'], true));
  pushIfMissing(have.has('to_address'), () => databases.createStringAttribute(DATABASE_ID, 'communications', 'to_address', 256, false));
  pushIfMissing(have.has('from_address'), () => databases.createStringAttribute(DATABASE_ID, 'communications', 'from_address', 256, false));
  pushIfMissing(have.has('body'), () => databases.createStringAttribute(DATABASE_ID, 'communications', 'body', 4096, false));
  pushIfMissing(have.has('sent_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'communications', 'sent_at', false));
  pushIfMissing(have.has('meta'), () => databases.createStringAttribute(DATABASE_ID, 'communications', 'meta', 2048, false));
  const keys = ['matter_id','channel','direction','to_address','from_address','body','sent_at','meta'];
  await Promise.all(ops);
  await waitForAttributes('communications', keys);
  await ensureIndex('communications', 'idx_comm_matter', IndexType.Key, ['matter_id']);
}

async function ensureHearings() {
  await ensureCollection('hearings', 'Hearings');
  const list = await databases.listAttributes(DATABASE_ID, 'hearings');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('matter_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'hearings', 'matters', RelationshipType.ManyToOne, false, 'matter_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('court_id'), () => databases.createStringAttribute(DATABASE_ID, 'hearings', 'court_id', 128, false));
  pushIfMissing(have.has('is_ssa_hearing'), () => databases.createBooleanAttribute(DATABASE_ID, 'hearings', 'is_ssa_hearing', false, false));
  pushIfMissing(have.has('hearing_type'), () => databases.createStringAttribute(DATABASE_ID, 'hearings', 'hearing_type', 128, false));
  pushIfMissing(have.has('start_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'hearings', 'start_at', false));
  pushIfMissing(have.has('end_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'hearings', 'end_at', false));
  pushIfMissing(have.has('courtroom'), () => databases.createStringAttribute(DATABASE_ID, 'hearings', 'courtroom', 64, false));
  pushIfMissing(have.has('judge_or_alj'), () => databases.createStringAttribute(DATABASE_ID, 'hearings', 'judge_or_alj', 128, false));
  pushIfMissing(have.has('notes'), () => databases.createStringAttribute(DATABASE_ID, 'hearings', 'notes', 4096, false));
  const keys = ['matter_id','court_id','is_ssa_hearing','hearing_type','start_at','end_at','courtroom','judge_or_alj','notes'];
  await Promise.all(ops);
  await waitForAttributes('hearings', keys);
  await ensureIndex('hearings', 'idx_hearings_matter', IndexType.Key, ['matter_id']);
  // Index for date range queries on dashboard
  await ensureIndex('hearings', 'idx_hearings_start_at', IndexType.Key, ['start_at']);
}

async function ensureInvoices() {
  await ensureCollection('invoices', 'Invoices');
  const list = await databases.listAttributes(DATABASE_ID, 'invoices');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('matter_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'invoices', 'matters', RelationshipType.ManyToOne, false, 'matter_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('invoice_number'), () => databases.createStringAttribute(DATABASE_ID, 'invoices', 'invoice_number', 64, true));
  pushIfMissing(have.has('issue_date'), () => databases.createDatetimeAttribute(DATABASE_ID, 'invoices', 'issue_date', true));
  pushIfMissing(have.has('due_date'), () => databases.createDatetimeAttribute(DATABASE_ID, 'invoices', 'due_date', true));
  pushIfMissing(have.has('line_items'), () => databases.createStringAttribute(DATABASE_ID, 'invoices', 'line_items', 8192, false));
  pushIfMissing(have.has('subtotal'), () => databases.createFloatAttribute(DATABASE_ID, 'invoices', 'subtotal', true));
  pushIfMissing(have.has('taxes'), () => databases.createFloatAttribute(DATABASE_ID, 'invoices', 'taxes', false, null, null, 0));
  pushIfMissing(have.has('discounts'), () => databases.createFloatAttribute(DATABASE_ID, 'invoices', 'discounts', false, null, null, 0));
  pushIfMissing(have.has('total'), () => databases.createFloatAttribute(DATABASE_ID, 'invoices', 'total', true));
  pushIfMissing(have.has('status'), () => databases.createEnumAttribute(DATABASE_ID, 'invoices', 'status', ['Draft','Sent','Paid','Overdue'], true));
  const keys = ['matter_id','invoice_number','issue_date','due_date','line_items','subtotal','taxes','discounts','total','status'];
  await Promise.all(ops);
  await waitForAttributes('invoices', keys);
  await ensureIndex('invoices', 'idx_invoices_number', IndexType.Unique, ['invoice_number']);
  await ensureIndex('invoices', 'idx_invoices_matter', IndexType.Key, ['matter_id']);
  // Index for unpaid status queries on dashboard
  await ensureIndex('invoices', 'idx_invoices_status', IndexType.Key, ['status']);
}

async function ensurePayments() {
  await ensureCollection('payments', 'Payments');
  const list = await databases.listAttributes(DATABASE_ID, 'payments');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('invoice_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'payments', 'invoices', RelationshipType.ManyToOne, false, 'invoice_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('payment_method'), () => databases.createEnumAttribute(DATABASE_ID, 'payments', 'payment_method', ['Card','ACH','Cash','Check'], true));
  pushIfMissing(have.has('amount'), () => databases.createFloatAttribute(DATABASE_ID, 'payments', 'amount', true));
  pushIfMissing(have.has('received_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'payments', 'received_at', true));
  pushIfMissing(have.has('reference'), () => databases.createStringAttribute(DATABASE_ID, 'payments', 'reference', 256, false));
  const keys = ['invoice_id','payment_method','amount','received_at','reference'];
  await Promise.all(ops);
  await waitForAttributes('payments', keys);
  await ensureIndex('payments', 'idx_payments_invoice', IndexType.Key, ['invoice_id']);
}

async function ensureDocumentsTemplates() {
  await ensureCollection('document_templates', 'Document Templates');
  const list = await databases.listAttributes(DATABASE_ID, 'document_templates');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('name'), () => databases.createStringAttribute(DATABASE_ID, 'document_templates', 'name', 256, true));
  pushIfMissing(have.has('category'), () => databases.createStringAttribute(DATABASE_ID, 'document_templates', 'category', 128, false));
  pushIfMissing(have.has('variables'), () => databases.createStringAttribute(DATABASE_ID, 'document_templates', 'variables', 4096, false));
  pushIfMissing(have.has('body'), () => databases.createStringAttribute(DATABASE_ID, 'document_templates', 'body', 4096, false));
  pushIfMissing(have.has('output_type'), () => databases.createEnumAttribute(DATABASE_ID, 'document_templates', 'output_type', ['docx','pdf'], false));
  const keys = ['name','category','variables','body','output_type'];
  await Promise.all(ops);
  await waitForAttributes('document_templates', keys);
}

async function ensureDeadlines() {
  await ensureCollection('deadlines', 'Deadlines');
  const list = await databases.listAttributes(DATABASE_ID, 'deadlines');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('matter_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'deadlines', 'matters', RelationshipType.ManyToOne, false, 'matter_id', undefined, RelationMutate.Cascade));
  pushIfMissing(have.has('title'), () => databases.createStringAttribute(DATABASE_ID, 'deadlines', 'title', 512, true));
  pushIfMissing(have.has('source'), () => databases.createEnumAttribute(DATABASE_ID, 'deadlines', 'source', ['Rule','CourtOrder','SSA','Manual'], false));
  pushIfMissing(have.has('trigger_event_id'), () => databases.createStringAttribute(DATABASE_ID, 'deadlines', 'trigger_event_id', 128, false));
  pushIfMissing(have.has('due_at'), () => databases.createDatetimeAttribute(DATABASE_ID, 'deadlines', 'due_at', true));
  pushIfMissing(have.has('status'), () => databases.createEnumAttribute(DATABASE_ID, 'deadlines', 'status', ['Open','Completed','PastDue'], true));
  pushIfMissing(have.has('responsible_user_ids'), () => databases.createStringAttribute(DATABASE_ID, 'deadlines', 'responsible_user_ids', 64, false, undefined, true));
  const keys = ['matter_id','title','source','trigger_event_id','due_at','status','responsible_user_ids'];
  await Promise.all(ops);
  await waitForAttributes('deadlines', keys);
  await ensureIndex('deadlines', 'idx_deadlines_matter', IndexType.Key, ['matter_id']);
  // Indexes for status + due_at range queries on dashboard
  await ensureIndex('deadlines', 'idx_deadlines_status', IndexType.Key, ['status']);
  await ensureIndex('deadlines', 'idx_deadlines_due_at', IndexType.Key, ['due_at']);
}

async function ensureCourts() {
  await ensureCollection('courts', 'Courts');
  const list = await databases.listAttributes(DATABASE_ID, 'courts');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('name'), () => databases.createStringAttribute(DATABASE_ID, 'courts', 'name', 256, true));
  pushIfMissing(have.has('jurisdiction'), () => databases.createStringAttribute(DATABASE_ID, 'courts', 'jurisdiction', 256, false));
  pushIfMissing(have.has('address'), () => databases.createStringAttribute(DATABASE_ID, 'courts', 'address', 1024, false));
  pushIfMissing(have.has('phone'), () => databases.createStringAttribute(DATABASE_ID, 'courts', 'phone', 32, false));
  pushIfMissing(have.has('clerk_email'), () => databases.createEmailAttribute(DATABASE_ID, 'courts', 'clerk_email', false));
  const keys = ['name','jurisdiction','address','phone','clerk_email'];
  await Promise.all(ops);
  await waitForAttributes('courts', keys);
}

async function ensureNotifications() {
  await ensureCollection('notifications', 'Notifications');
  const list = await databases.listAttributes(DATABASE_ID, 'notifications');
  const have = new Set(list.attributes.map((a) => a.key));
  const ops = [];
  const pushIfMissing = (exists, fn) => { if (!exists) ops.push(fn()); };

  pushIfMissing(have.has('user_id'), () => databases.createStringAttribute(DATABASE_ID, 'notifications', 'user_id', 64, true));
  pushIfMissing(have.has('title'), () => databases.createStringAttribute(DATABASE_ID, 'notifications', 'title', 256, true));
  pushIfMissing(have.has('message'), () => databases.createStringAttribute(DATABASE_ID, 'notifications', 'message', 4096, true));
  pushIfMissing(have.has('type'), () => databases.createEnumAttribute(DATABASE_ID, 'notifications', 'type', ['deadline','hearing','payment','document','message','system'], true));
  pushIfMissing(have.has('priority'), () => databases.createEnumAttribute(DATABASE_ID, 'notifications', 'priority', ['low','medium','high','urgent'], true));
  pushIfMissing(have.has('is_read'), () => databases.createBooleanAttribute(DATABASE_ID, 'notifications', 'is_read', false, false));
  pushIfMissing(have.has('action_url'), () => databases.createStringAttribute(DATABASE_ID, 'notifications', 'action_url', 2048, false));
  pushIfMissing(have.has('related_matter_id'), () => databases.createRelationshipAttribute(DATABASE_ID, 'notifications', 'matters', RelationshipType.ManyToOne, false, 'related_matter_id', undefined, RelationMutate.Cascade));

  const keys = ['user_id','title','message','type','priority','is_read','action_url','related_matter_id'];
  await Promise.all(ops);
  await waitForAttributes('notifications', keys);
  await ensureIndex('notifications', 'idx_notifications_user', IndexType.Key, ['user_id']);
  await ensureIndex('notifications', 'idx_notifications_is_read', IndexType.Key, ['is_read']);
  await ensureIndex('notifications', 'idx_notifications_user_is_read', IndexType.Key, ['user_id','is_read']);
}

async function main() {
  console.log('Setting up Appwrite resources...');
  await ensureDatabase();
  await Promise.all([
    ensureBucketDocuments(),
  ]);

  // Core collections needed for client portal + matters
  await ensureClients();
  await ensureMatters();
  await ensureDocuments();
  await ensureDocumentVersions();
  await ensureCommunications();
  await ensureHearings();
  await ensureInvoices();
  await ensurePayments();
  await ensureDeadlines();
  await ensureNotifications();
  await ensureDocumentsTemplates();
  await ensureCourts();
  await ensureTimeEntries();
  await ensureTasks();

  console.log('Appwrite setup complete.');
}

main().catch((err) => {
  console.error('Setup failed:', err?.message || err);
  process.exit(1);
});
