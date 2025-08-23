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

function addHeading(doc, text, y, size = 18) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(size);
  doc.text(text, MARGIN_LEFT, y);
  return y + 22;
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
const generatedAt = '2025-08-10 19:23:29 -05:00';

// The summary content
const summarySections = [
  {
    heading: 'What it is',
    paragraphs: [
      'A legal case manager app, now fully on Appwrite:'
    ],
    bullets: [
      'Frontend: React 19 + Vite 6 + React Router + Tailwind',
      'Backend: Appwrite-first (Databases, Storage, Auth). No Cloudflare Worker.',
      'Auth: Appwrite Auth (Google OAuth via Web SDK).',
      'Hosting: Static site deployed to Appwrite Sites via GitHub Actions'
    ]
  },
  {
    heading: 'Key directories and files',
    paragraphs: [
      'Frontend (SPA): index.html boots /src/react-app/main.tsx; pages under src/react-app/pages; shared components in src/react-app/components; AuthProvider manages session context; lib/appwrite.ts wires Appwrite Web SDK; storage/file uploads via Appwrite Storage.',
      'Shared utilities: src/shared/email-service.ts (SendGrid send/parse, templates, reply tracking), src/shared/document-generator.ts (docx/html-docx-js/jsPDF).',
      'Data & infra: migrations/ capture historical schema; scripts/appwrite/setup.mjs provisions Appwrite (database, collections, bucket). CI deploys dist/ to Appwrite Sites.'
    ]
  },
  {
    heading: 'How it works (end-to-end)',
    bullets: [
      'Auth: Appwrite Web SDK handles Google OAuth sessions (Account.createOAuth2Session).',
      'Data: Frontend reads/writes via Appwrite Databases (collections: clients, matters, documents, deadlines, hearings, invoices, etc.).',
      'Files: Uploaded directly to Appwrite Storage (bucket: documents); file URLs use storage:// scheme resolved by UI.',
      'Email: SendGrid for notifications (server-side integration to be hosted on Appwrite Functions).',
      'Hosting: Frontend on Appwrite Sites.'
    ]
  },
  {
    heading: 'Commands',
    bullets: [
      'npm install',
      'npm run dev (Vite dev server)',
      'npm run build',
      'npm run lint'
    ]
  },
  {
    heading: 'Environment',
    bullets: [
      'Frontend build: VITE_APPWRITE_ENDPOINT, VITE_APPWRITE_PROJECT_ID',
      'Backend (future Appwrite Functions): SENDGRID_API_KEY if sending email from server-side'
    ]
  },
  {
    heading: 'Notable to-dos',
    bullets: [
      'Remove legacy Cloudflare Worker code and configs (src/worker/, wrangler.jsonc, .wrangler/, tsconfig.worker.json).',
      'Replace any remaining references to Mocha/Cloudflare in docs or code comments.',
      'Optionally migrate SendGrid email flows to Appwrite Functions.'
    ]
  }
];

function buildPdf(outputPath) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });

  // Title
  let y = MARGIN_TOP;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Jusivo Case Manager — Codebase Summary', MARGIN_LEFT, y);
  y += 26;

  // Subtitle / timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt}`, MARGIN_LEFT, y);
  y += 20;

  // Sections
  for (const section of summarySections) {
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
const outputPath = outArg || path.join(process.cwd(), 'docs', 'Jusivo_Codebase_Summary.pdf');
const saved = buildPdf(outputPath);
console.log(`PDF written to: ${saved}`);
