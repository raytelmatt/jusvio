#!/usr/bin/env node

// Seed sample notifications into the Appwrite 'notifications' collection.
// Usage examples:
//   node scripts/appwrite/seed-notifications.mjs --user-id <APPWRITE_USER_ID> --count 3
//   node scripts/appwrite/seed-notifications.mjs --all-users --count 2
// Environment required (reads .env.local or .env if present):
//   APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY

import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const sdk = require('node-appwrite');

const {
  Client,
  Databases,
  Users,
  ID,
  Permission,
  Role,
} = sdk;

const DATABASE_ID = 'jusivo';
const COLLECTION_ID = 'notifications';

// Minimal env loader (same as setup.mjs)
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
      if (!(key in process.env)) {
        process.env[key] = val;
      }
    }
  }
}

function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

function parseArgs(argv) {
  const args = { count: 3, allUsers: false, userId: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all-users') args.allUsers = true;
    else if (a === '--user-id') { args.userId = argv[++i]; }
    else if (a === '--count') { args.count = Number(argv[++i] || '3'); }
  }
  if (!Number.isFinite(args.count) || args.count < 1) args.count = 1;
  return args;
}

function makeSamples(count) {
  const types = ['system', 'deadline', 'hearing', 'payment', 'document', 'message'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const samples = [];
  for (let i = 0; i < count; i++) {
    const t = types[i % types.length];
    const p = priorities[i % priorities.length];
    samples.push({
      title: `Sample ${t} notification #${i + 1}`,
      message: `This is a seeded ${t} notification created for testing.`,
      type: t,
      priority: p,
      is_read: false,
      action_url: t === 'document' ? '/documents' : (t === 'deadline' ? '/deadlines' : ''),
    });
  }
  return samples;
}

async function main() {
  loadEnv();
  const ENDPOINT = reqEnv('APPWRITE_ENDPOINT');
  const PROJECT_ID = reqEnv('APPWRITE_PROJECT_ID');
  const API_KEY = reqEnv('APPWRITE_API_KEY');

  const { allUsers, userId, count } = parseArgs(process.argv);

  const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
  const databases = new Databases(client);
  const users = new Users(client);

  let targetUserIds = [];
  if (userId) {
    targetUserIds = [userId];
  } else if (allUsers) {
    const listed = await users.list();
    targetUserIds = (listed.users || []).map((u) => u.$id);
  } else {
    const listed = await users.list();
    if ((listed.users || []).length === 1) {
      targetUserIds = [listed.users[0].$id];
    } else {
      console.error('Multiple or zero users found. Please pass --user-id <id> or --all-users');
      process.exit(1);
    }
  }

  if (targetUserIds.length === 0) {
    console.log('No users to seed. Exiting.');
    return;
  }

  console.log(`Seeding ${count} notification(s) for ${targetUserIds.length} user(s)...`);

  const samples = makeSamples(count);

  for (const uid of targetUserIds) {
    for (const s of samples) {
      const data = {
        user_id: uid,
        title: s.title,
        message: s.message,
        type: s.type,
        priority: s.priority,
        is_read: s.is_read,
        action_url: s.action_url || undefined,
      };
      const perms = [
        Permission.read(Role.user(uid)),
        Permission.update(Role.user(uid)),
        Permission.delete(Role.user(uid)),
      ];
      const doc = await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data, perms);
      console.log(`Created notification ${doc.$id} for user ${uid}`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed:', err?.message || err);
    process.exit(1);
  });
