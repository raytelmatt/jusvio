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

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_LEFT = 56;
const MARGIN_TOP = 56;
const MARGIN_BOTTOM = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2;
const LINE_HEIGHT = 14;

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
  return y + 6;
}

function addBullets(doc, items, y) {
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

function buildPdf(outputPath) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  let y = MARGIN_TOP;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Matter Detail Page — What Was Fixed and Why', MARGIN_LEFT, y);
  y += 26;

  // Timestamp
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, MARGIN_LEFT, y);
  y += 18;

  // Sections
  y = addHeading(doc, 'Summary', y);
  y = addParagraph(doc, 'This document explains the issues identified on the Matter Detail page, what was broken, and why each fix was made. It is written for a non-technical audience.', y);

  y = addHeading(doc, 'What was broken and why it was fixed', y);
  y = addBullets(doc, [
    'Save button didn’t save: Clicking “Save Changes” only showed a pop-up and did not store edits. Now it saves your updates (like case number or jurisdiction) to Firestore so changes persist.',
    'Case details not loading: The page looked for “criminal_data” but your data lives under “case_data” as a JSON string. It now reads and safely parses “case_data” so fields show correctly.',
    'Messages showed the wrong fields: The page used “content” while your records store message text in “body”, so messages could appear blank. It now shows the real message body and a reasonable subject.',
    'Billing totals unreliable: Some amounts arrived as text, which could break formatting or display. Totals are now converted to numbers first so currency formatting is correct.',
    'Timeline not visible: Events were collected but never displayed. The Timeline tab now shows documents, invoices, time entries, hearings, deadlines, and communications in date order.',
    'Document preview disabled: Clicking a document didn’t open a preview. You can now click a document to see its details.',
    'Inconsistent backend settings: Mixed hard-coded database names with shared settings, causing environment fragility. All calls now use the shared Firebase configuration.',
    'Developer leftovers: Debug pop-ups and logs triggered on Save. These were removed for a clean, professional experience.'
  ], y);

  y = addHeading(doc, 'What changed under the hood', y);
  y = addBullets(doc, [
    'Implemented real saving: The Save button writes case updates into the matter record’s “case_data” field.',
    'Consistent data loading: The page parses “case_data” and fills the form fields predictably.',
    'Robust numbers: Invoice amounts/total are coerced to numbers before formatting.',
    'Accurate communications: Uses the “body” field and a sensible subject fallback.',
    'Enabled preview: Document items are clickable and open a preview modal.',
    'Live Timeline: Timeline events are stored in page state and rendered newest first.',
    'Unified settings: Every database call now goes through the same shared constants.'
  ], y);

  y = addHeading(doc, 'How the update was rolled out', y);
  y = addBullets(doc, [
    'Built the site for production and adjusted the build so test files do not block deployment.',
    'Committed and pushed the changes to the main branch.',
    'An automated workflow deployed the updated site to Firebase Hosting.'
  ], y);

  ensureDirSync(outputPath);
  const arrayBuffer = doc.output('arraybuffer');
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

const outArg = process.argv[2];
const outputPath = outArg || path.join(process.cwd(), 'docs', 'Matter_Detail_Fixes.pdf');
const saved = buildPdf(outputPath);
console.log(`PDF written to: ${saved}`);

