#!/usr/bin/env node
import 'dotenv/config';
import admin from 'firebase-admin';
import { Client, Users } from 'node-appwrite';

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

function loadServiceAccount() {
  const jsonB64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (jsonB64) {
    return JSON.parse(Buffer.from(jsonB64, 'base64').toString('utf8'));
  }
  const path = process.env.SERVICE_ACCOUNT_KEY_PATH;
  if (!path) throw new Error('Provide FIREBASE_SERVICE_ACCOUNT or SERVICE_ACCOUNT_KEY_PATH');
  return (await import('fs')).default.readFileSync(path, 'utf8');
}

async function initFirebase() {
  const sa = typeof loadServiceAccount === 'function' ? await loadServiceAccount() : loadServiceAccount;
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(sa) });
  }
}

async function fetchAppwriteUsers() {
  const endpoint = requireEnv('APPWRITE_ENDPOINT');
  const projectId = requireEnv('APPWRITE_PROJECT_ID');
  const apiKey = requireEnv('APPWRITE_API_KEY');
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const users = new Users(client);
  const acc = [];
  let cursor = undefined;
  // paginate
  while (true) {
    const res = await users.list(undefined, undefined, undefined, cursor);
    acc.push(...res.users);
    if (!res.users.length) break;
    cursor = res.users[res.users.length - 1].$id;
  }
  return acc;
}

async function migrate() {
  await initFirebase();
  const auth = admin.auth();
  const users = await fetchAppwriteUsers();
  console.log(`Found ${users.length} Appwrite users`);

  for (const u of users) {
    const email = u.email;
    if (!email) continue;
    try {
      const existing = await auth.getUserByEmail(email).catch(() => null);
      if (existing) {
        console.log('Skip existing', email);
        continue;
      }
      await auth.createUser({
        email,
        emailVerified: Boolean(u.emailVerification),
        displayName: u.name || undefined,
        disabled: false,
      });
      const link = await auth.generatePasswordResetLink(email);
      console.log('Created user & reset link:', email, link);
    } catch (e) {
      console.warn('Failed to migrate', email, e?.message || e);
    }
  }
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});


