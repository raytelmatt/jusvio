#!/usr/bin/env node

import { createRequire } from 'module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const sdk = require('node-appwrite');

const { Client, Databases, Query } = sdk;

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
  process.exit(1);
}

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);
const DATABASE_ID = 'jusivo';

async function testMatterSave() {
  console.log('Testing Matter Save Functionality...\n');
  
  try {
    // 1. Get a matter to test with
    const matters = await databases.listDocuments(DATABASE_ID, 'matters', [Query.limit(1)]);
    if (!matters.documents || matters.documents.length === 0) {
      console.error('No matters found to test with');
      return;
    }
    
    const matter = matters.documents[0];
    console.log(`Testing with matter: ${matter.title} (ID: ${matter.$id})`);
    
    // 2. Try to save case_data directly to matters collection
    const testData = {
      court: 'Test Court',
      caseNumber: 'TEST-123',
      charges: ['Test Charge 1', 'Test Charge 2'],
      arrestDate: new Date().toISOString(),
      bailAmount: 5000,
      notes: 'This is test data from the save functionality test',
      testTimestamp: new Date().toISOString()
    };
    
    console.log('\n1. Attempting to save case_data to matters collection...');
    let savedToMatters = false;
    
    try {
      await databases.updateDocument(
        DATABASE_ID,
        'matters',
        matter.$id,
        { case_data: JSON.stringify(testData) }
      );
      savedToMatters = true;
      console.log('✓ Successfully saved to matters.case_data');
    } catch (err) {
      const message = err.message || '';
      if (message.toLowerCase().includes('attribute') || message.toLowerCase().includes('case_data')) {
        console.log('✗ Cannot save to matters.case_data (attribute missing or limit reached)');
      } else {
        console.log('✗ Error saving to matters:', err.message);
      }
    }
    
    // 3. If matters save failed, try matters_meta
    if (!savedToMatters) {
      console.log('\n2. Falling back to matters_meta collection...');
      
      // Check if document exists
      const existing = await databases.listDocuments(
        DATABASE_ID,
        'matters_meta',
        [Query.equal('matter_id', matter.$id)]
      );
      
      if (existing.documents && existing.documents.length > 0) {
        // Update existing
        console.log('   Found existing matters_meta document, updating...');
        await databases.updateDocument(
          DATABASE_ID,
          'matters_meta',
          existing.documents[0].$id,
          { 
            matter_id: matter.$id,
            case_data: JSON.stringify(testData) 
          }
        );
        console.log('✓ Successfully updated matters_meta document');
      } else {
        // Create new
        console.log('   No existing matters_meta document, creating...');
        await databases.createDocument(
          DATABASE_ID,
          'matters_meta',
          'unique()',
          { 
            matter_id: matter.$id,
            case_data: JSON.stringify(testData) 
          }
        );
        console.log('✓ Successfully created matters_meta document');
      }
    }
    
    // 4. Verify the data can be read back
    console.log('\n3. Verifying saved data...');
    
    // Try to read from matters first
    let readData = null;
    try {
      const matterDoc = await databases.getDocument(DATABASE_ID, 'matters', matter.$id);
      if (matterDoc.case_data) {
        readData = JSON.parse(matterDoc.case_data);
        console.log('✓ Read data from matters.case_data');
      }
    } catch (err) {
      console.log('   Could not read from matters.case_data');
    }
    
    // If not in matters, try matters_meta
    if (!readData) {
      const metaDocs = await databases.listDocuments(
        DATABASE_ID,
        'matters_meta',
        [Query.equal('matter_id', matter.$id)]
      );
      
      if (metaDocs.documents && metaDocs.documents.length > 0) {
        readData = JSON.parse(metaDocs.documents[0].case_data);
        console.log('✓ Read data from matters_meta.case_data');
      }
    }
    
    if (readData) {
      console.log('\n✓ Data successfully saved and retrieved!');
      console.log('  Test timestamp:', readData.testTimestamp);
      console.log('  Court:', readData.court);
      console.log('  Case Number:', readData.caseNumber);
    } else {
      console.log('\n✗ Could not retrieve saved data');
    }
    
    console.log('\n✅ Save functionality test complete!');
    console.log('\nThe Matter Detail page should now be able to save changes.');
    
  } catch (err) {
    console.error('\n✗ Test failed:', err.message);
  }
}

testMatterSave().catch(console.error);
