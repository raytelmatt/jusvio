#!/usr/bin/env node

/**
 * GitHub-Linear Sync Script
 * 
 * This script helps sync GitHub issues with Linear issues
 * Usage: node scripts/linear/sync-github.mjs [options]
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showHelp() {
  console.log(`
GitHub-Linear Sync Script

Usage:
  node scripts/linear/sync-github.mjs [options]

Options:
  --github-issue <number>  GitHub issue number to sync
  --linear-issue <id>      Linear issue ID (e.g., RAY-123)
  --action <action>        Action to perform (link, unlink, sync)
  --help, -h               Show this help message

Actions:
  - link: Link a GitHub issue to a Linear issue
  - unlink: Remove link between GitHub and Linear issues
  - sync: Sync status and comments between linked issues

Examples:
  node scripts/linear/sync-github.mjs --github-issue 42 --linear-issue RAY-123 --action link
  node scripts/linear/sync-github.mjs --github-issue 42 --linear-issue RAY-123 --action sync
  node scripts/linear/sync-github.mjs --github-issue 42 --action unlink
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--github-issue':
        options.githubIssue = parseInt(nextArg);
        i++;
        break;
      case '--linear-issue':
        options.linearIssue = nextArg;
        i++;
        break;
      case '--action':
        options.action = nextArg;
        i++;
        break;
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
      default:
        console.error(`Unknown option: ${arg}`);
        showHelp();
        process.exit(1);
    }
  }
  
  return options;
}

function validateOptions(options) {
  if (!options.action) {
    console.error('Error: --action is required');
    showHelp();
    process.exit(1);
  }
  
  const validActions = ['link', 'unlink', 'sync'];
  if (!validActions.includes(options.action)) {
    console.error(`Error: Invalid action: ${options.action}`);
    console.error(`Valid actions: ${validActions.join(', ')}`);
    process.exit(1);
  }
  
  if (options.action === 'link' || options.action === 'sync') {
    if (!options.githubIssue) {
      console.error('Error: --github-issue is required for link/sync actions');
      showHelp();
      process.exit(1);
    }
    
    if (!options.linearIssue) {
      console.error('Error: --linear-issue is required for link/sync actions');
      showHelp();
      process.exit(1);
    }
  }
  
  if (options.action === 'unlink') {
    if (!options.githubIssue && !options.linearIssue) {
      console.error('Error: Either --github-issue or --linear-issue is required for unlink action');
      showHelp();
      process.exit(1);
    }
  }
  
  // Validate Linear issue ID format
  if (options.linearIssue && !options.linearIssue.match(/^RAY-\d+$/)) {
    console.error(`Error: Invalid Linear issue ID format: ${options.linearIssue}`);
    console.error('Expected format: RAY-123');
    process.exit(1);
  }
}

function linkIssues(githubIssue, linearIssue) {
  console.log(`Linking GitHub issue #${githubIssue} to Linear issue ${linearIssue}`);
  
  // This would normally:
  // 1. Add a comment to the GitHub issue with the Linear issue link
  // 2. Add a link to the Linear issue pointing to the GitHub issue
  // 3. Update any relevant metadata
  
  console.log('\nActions to perform:');
  console.log(`1. Add comment to GitHub issue #${githubIssue}: "Linked to Linear issue: ${linearIssue}"`);
  console.log(`2. Add link to Linear issue ${linearIssue}: "GitHub Issue #${githubIssue}"`);
  console.log('3. Update issue metadata to reflect the link');
  
  console.log('\nGitHub CLI commands:');
  console.log(`gh issue comment ${githubIssue} --body "Linked to Linear issue: ${linearIssue}"`);
  
  console.log('\nLinear CLI commands:');
  console.log(`linear issue update ${linearIssue} --link "GitHub Issue #${githubIssue}"`);
}

function unlinkIssues(githubIssue, linearIssue) {
  console.log(`Unlinking GitHub issue #${githubIssue} from Linear issue ${linearIssue}`);
  
  console.log('\nActions to perform:');
  console.log('1. Remove link references from both issues');
  console.log('2. Add comment noting the unlink action');
  console.log('3. Update issue metadata');
  
  console.log('\nManual steps required:');
  console.log('1. Remove Linear issue reference from GitHub issue');
  console.log('2. Remove GitHub issue reference from Linear issue');
}

function syncIssues(githubIssue, linearIssue) {
  console.log(`Syncing GitHub issue #${githubIssue} with Linear issue ${linearIssue}`);
  
  console.log('\nActions to perform:');
  console.log('1. Sync status between issues');
  console.log('2. Sync comments and updates');
  console.log('3. Ensure metadata consistency');
  
  console.log('\nNote: This requires API access to both GitHub and Linear');
  console.log('Consider using webhooks for real-time synchronization');
}

function main() {
  const options = parseArgs();
  validateOptions(options);
  
  switch (options.action) {
    case 'link':
      linkIssues(options.githubIssue, options.linearIssue);
      break;
    case 'unlink':
      unlinkIssues(options.githubIssue, options.linearIssue);
      break;
    case 'sync':
      syncIssues(options.githubIssue, options.linearIssue);
      break;
  }
}

main();
