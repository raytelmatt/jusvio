#!/usr/bin/env node

import { jsPDF } from 'jspdf';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function ensureDirSync(p) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function addHeading(doc, text, y, size = 16) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.text(text, MARGIN_LEFT, y);
  return y + 20;
}

function addParagraph(doc, text, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  for (const line of lines) {
    if (y > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      y = MARGIN_TOP;
    }
    doc.text(line, MARGIN_LEFT, y);
    y += LINE_HEIGHT;
  }
  return y + 6; // extra spacing after paragraph
}

function addList(doc, items, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  for (const item of items) {
    const lines = doc.splitTextToSize(`• ${item}`, CONTENT_WIDTH);
    for (const line of lines) {
      if (y > PAGE_HEIGHT - MARGIN_BOTTOM) {
        doc.addPage();
        y = MARGIN_TOP;
      }
      doc.text(line, MARGIN_LEFT, y);
      y += LINE_HEIGHT;
    }
  }
  return y + 6;
}

// Layout constants
const PAGE_WIDTH = 612; // Letter width in points
const PAGE_HEIGHT = 792; // Letter height in points
const MARGIN_LEFT = 56;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2;
const LINE_HEIGHT = 14;

// Timestamp from request context
const generatedAt = '2025-08-10 19:32:51 -05:00';

// Migration plan content (derived from assistant's last response)
const sections = [
  {
    heading: 'Goal',
    paragraphs: [
      'Migrate the entire stack to Appwrite for auth, database, storage, backend functions, and hosting. Remove Cloudflare and Mocha completely.'
    ]
  },
  {
    heading: 'What changes',
    bullets: [
      'Auth: Use Appwrite Auth (OAuth2 Google, email/password) via Web SDK',
      'Database: Move from Cloudflare D1 (SQLite) to Appwrite Databases (collections, attributes, indexes, document permissions)',
      'Storage: Replace R2 with Appwrite Storage buckets',
      'Backend APIs and jobs: Replace Cloudflare Worker with Appwrite Functions (HTTP endpoints, scheduled jobs, document generation)',
      'Email: Prefer Appwrite Messaging (Email channel). If inbound parsing is required, keep SendGrid only as inbound to an Appwrite Function',
      'Hosting: Keep Appwrite Sites for the SPA',
      'No Cloudflare and no Mocha in the final architecture'
    ]
  },
  {
    heading: 'Concrete mapping — Auth',
    bullets: [
      'Was: Mocha Users Service + custom cookies',
      'Now: Appwrite account sessions via OAuth2 (Google) and/or email/password',
      'Frontend: Update AuthProvider to use account.createOAuth2Session / account.createEmailPasswordSession and account.get()',
      'Remove Worker endpoints: /api/oauth..., /api/sessions, /api/users/me'
    ]
  },
  {
    heading: 'Concrete mapping — Database',
    bullets: [
      'Was: Cloudflare D1 SQL migrations',
      'Now: Appwrite Database "jusivo" with collections: clients, matters, documents, document_templates, document_versions, deadlines, hearings, time_entries, invoices, communications, deadline_notes, user_profiles',
      'Permissions: Staff (Team/Role) access to everything; Clients restricted to their own documents/communications; document-level permissions',
      'Migrations: One-off script to read D1 and create Appwrite documents with proper links and permissions'
    ]
  },
  {
    heading: 'Concrete mapping — Storage',
    bullets: [
      'Was: R2 + custom /api/files/:fileKey routes',
      'Now: Appwrite Storage bucket "documents"; use storage.getFileView / storage.getFileDownload directly',
      'Remove r2-routes and any R2-specific logic'
    ]
  },
  {
    heading: 'Concrete mapping — Email',
    bullets: [
      'Outbound: Use Appwrite Messaging (Email via SMTP) or keep SendGrid from an Appwrite Function for advanced templating',
      'Inbound: Configure SendGrid Inbound Parse to call a public Appwrite Function (HTTP) that parses and stores communications; link to deadlines/hearings when applicable'
    ]
  },
  {
    heading: 'Concrete mapping — Backend routes / jobs',
    bullets: [
      'client-portal-lookup (HTTP): sanitize inputs and return safe client info',
      'client-portal-data (HTTP): fetch client’s matters, documents, messages, invoices, upcoming hearings',
      'email-inbound (HTTP): parse inbound email payload; write to communications; update deadlines/hearings',
      'notification-scheduler (Scheduled): send deadline/hearing reminders via Messaging',
      'document-generator (HTTP/Task): generate DOCX/PDF to Storage and return file IDs'
    ]
  },
  {
    heading: 'Frontend refactor scope',
    bullets: [
      'Replace fetches to /api/... with Appwrite Database SDK calls where allowed by permissions, or with Function HTTP endpoints for server-side logic',
      'Update AuthProvider to rely solely on Appwrite account.* (sessions, current user)',
      'Remove cookie/session logic and Worker auth endpoints',
      'Keep storage helpers; serve document links via Appwrite file URLs'
    ]
  },
  {
    heading: 'CI/CD',
    bullets: [
      'Sites: Keep existing GitHub Action to build and deploy dist/client to Appwrite Sites',
      'Functions: Add Appwrite CLI to CI to deploy functions; define appwrite.json and function directories (Node 20 runtime, HTTP/schedule triggers, env vars)',
      'Example: npx appwrite deploy function --all'
    ]
  },
  {
    heading: 'Data migration (one-off)',
    bullets: [
      'Export D1 data (SQL/CSV/JSON) or query locally',
      'Write a Node script using Appwrite Admin API to create documents with proper permissions and IDs',
      'Validate referential integrity (matter_id, client_id, etc.)'
    ]
  },
  {
    heading: 'Sequenced steps to execute',
    bullets: [
      '1) Appwrite Console — Create Database collections/attributes/indexes; set permissions; create Storage bucket "documents"; enable OAuth2 Google (and/or email/password); configure Messaging SMTP; create Teams/Roles for staff and decide client role mapping (e.g., user_profiles)',
      '2) Functions — Scaffold client-portal-lookup (HTTP), client-portal-data (HTTP), email-inbound (HTTP), notification-scheduler (CRON), document-generator (HTTP/Task); add required environment variables; implement minimal versions and test',
      '3) Frontend — Swap AuthProvider to Appwrite account.*; replace API calls with Appwrite SDK/Functions; remove Worker-specific logic and paths; keep storage helpers',
      '4) Remove Cloudflare/Mocha — Delete wrangler config and src/worker/*; remove Hono, @cloudflare/vite-plugin, Mocha packages; prune npm deps',
      '5) Data migration — Run the one-off importer and verify data and permissions',
      '6) Cutover — Deploy functions and site; update allowed origins in Appwrite; verify OAuth callback; smoke test flows'
    ]
  },
  {
    heading: 'Next actions (options)',
    bullets: [
      'Draft exact Appwrite Database schema (collections/fields/indexes/permissions) for approval',
      'Scaffold Appwrite Functions (folders + appwrite.json) and CI deployment step',
      'Refactor AuthProvider and one representative page (e.g., Clients) to demonstrate the integration pattern'
    ]
  }
];

function buildPdf(outputPath) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // Title
  let y = MARGIN_TOP;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Jusivo — Appwrite Migration Plan', MARGIN_LEFT, y);
  y += 26;

  // Subtitle / timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt}`, MARGIN_LEFT, y);
  y += 20;

  // Sections
  for (const section of sections) {
    y = addHeading(doc, section.heading, y, 14);
    if (section.paragraphs) {
      for (const p of section.paragraphs) {
        y = addParagraph(doc, p, y);
      }
    }
    if (section.bullets) {
      y = addList(doc, section.bullets, y);
    }
    y += 6;
  }

  // Write file
  ensureDirSync(outputPath);
  const arrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

const outArg = process.argv[2];
const outputPath = outArg || path.join(process.cwd(), 'docs', 'Jusivo_Appwrite_Migration.pdf');
const saved = buildPdf(outputPath);
console.log(`PDF written to: ${saved}`);
