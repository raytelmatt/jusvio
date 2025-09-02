#!/usr/bin/env node

import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const sdk = require('node-appwrite');

const { Client, Databases, Permission, Role } = sdk;

// Load .env.local or .env into process.env
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

loadEnv();

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT;
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;

if (!ENDPOINT || !PROJECT_ID || !API_KEY) {
  console.error('Missing required environment variables');
  console.error('ENDPOINT:', ENDPOINT);
  console.error('PROJECT_ID:', PROJECT_ID);
  console.error('API_KEY:', API_KEY ? 'SET' : 'NOT SET');
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const DATABASE_ID = 'jusivo';

async function main() {
  console.log('Checking matters_meta collection...');
  
  try {
    const collection = await databases.getCollection(DATABASE_ID, 'matters_meta');
    console.log('✓ matters_meta collection exists:', collection.name);
    
    const attrs = await databases.listAttributes(DATABASE_ID, 'matters_meta');
    console.log('✓ Attributes:', attrs.attributes.map(a => `${a.key} (${a.type})`).join(', '));
    
    // Check if we can query it
    const docs = await databases.listDocuments(DATABASE_ID, 'matters_meta');
    console.log('✓ Documents in matters_meta:', docs.total);
    
  } catch (err) {
    console.log('✗ matters_meta collection does not exist or is not accessible');
    console.log('Error:', err.message);
    
    // Try to create it
    console.log('\nAttempting to create matters_meta collection...');
    try {
      const defaultPerms = [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ];
      
      await databases.createCollection(
        DATABASE_ID, 
        'matters_meta', 
        'Matters Meta', 
        defaultPerms, 
        true, // documentSecurity
        true  // enabled
      );
      console.log('✓ Successfully created matters_meta collection');
      
      // Now add the attributes
      console.log('Adding attributes...');
      
      // Note: We're NOT creating a relationship attribute because that might fail
      // Instead, we'll just store the matter_id as a string
      await databases.createStringAttribute(DATABASE_ID, 'matters_meta', 'matter_id', 36, true);
      console.log('✓ Added matter_id attribute');
      
      await databases.createStringAttribute(DATABASE_ID, 'matters_meta', 'case_data', 8192, false);
      console.log('✓ Added case_data attribute');
      
      // Create unique index on matter_id
      console.log('Creating index...');
      await new Promise(r => setTimeout(r, 2000)); // Wait for attributes to be available
      
      await databases.createIndex(
        DATABASE_ID, 
        'matters_meta', 
        'idx_matters_meta_matter_unique', 
        'unique', 
        ['matter_id']
      );
      console.log('✓ Created unique index on matter_id');
      
      console.log('\n✓ matters_meta collection setup complete!');
      
    } catch (createErr) {
      console.error('✗ Failed to create matters_meta:', createErr.message);
    }
  }
}

main().catch(err => {
  console.error('Script failed:', err.message);
  process.exit(1);
});
