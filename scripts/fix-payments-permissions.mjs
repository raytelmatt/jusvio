#!/usr/bin/env node

// Script to fix payments collection permissions in Appwrite
// Usage:
//   APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1 \
//   APPWRITE_PROJECT_ID=YOUR_PROJECT_ID \
//   APPWRITE_API_KEY=YOUR_API_KEY \
//   node scripts/fix-payments-permissions.mjs

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sdk = require('node-appwrite');

const {
  Client,
  Databases,
  Permission,
  Role,
} = sdk;

// Load .env.local or .env into process.env
function loadEnv() {
  const fs = require('fs');
  const path = require('path');
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

loadEnv();

function reqEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env ${name}`);
  return v;
}

const APPWRITE_ENDPOINT = reqEnv('APPWRITE_ENDPOINT');
const APPWRITE_PROJECT_ID = reqEnv('APPWRITE_PROJECT_ID');
const APPWRITE_API_KEY = reqEnv('APPWRITE_API_KEY');
const DATABASE_ID = process.env.DATABASE_ID || 'jusivo';

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)
  .setKey(APPWRITE_API_KEY);

const databases = new Databases(client);

async function fixPaymentsPermissions() {
  try {
    console.log('Checking payments collection permissions...');
    
    // Get the current collection
    const collection = await databases.getCollection(DATABASE_ID, 'payments');
    console.log(`Found payments collection: ${collection.name}`);
    
    // Set proper permissions for authenticated users
    const permissions = [
      Permission.read(Role.users()),
      Permission.create(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ];
    
    console.log('Updating payments collection permissions...');
    await databases.updateCollection(DATABASE_ID, 'payments', 'Payments', permissions, true);
    
    console.log('✅ Payments collection permissions updated successfully!');
    console.log('Users can now create, read, update, and delete payment records.');
    
  } catch (error) {
    if (error.code === 404) {
      console.log('❌ Payments collection not found. Please run the setup script first.');
    } else {
      console.error('❌ Error fixing payments permissions:', error.message);
      console.error('Full error:', error);
    }
  }
}

async function main() {
  try {
    console.log('🔧 Fixing Payments Collection Permissions');
    console.log('==========================================');
    console.log(`Endpoint: ${APPWRITE_ENDPOINT}`);
    console.log(`Project: ${APPWRITE_PROJECT_ID}`);
    console.log(`Database: ${DATABASE_ID}`);
    console.log('');
    
    await fixPaymentsPermissions();
    
    console.log('');
    console.log('🎉 Script completed successfully!');
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

main();
