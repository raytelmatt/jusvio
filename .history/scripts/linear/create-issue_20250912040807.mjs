#!/usr/bin/env node

/**
 * Linear Issue Creation Script
 * 
 * This script helps create Linear issues from command line or templates
 * Usage: node scripts/linear/create-issue.mjs [options]
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const CONFIG = {
  teamId: 'aca73299-760f-4fdf-9000-fb5febaf7e96', // RAYTEL team
  assigneeId: '79aab23d-7dd4-4a3a-a483-f06e09c8f557', // Matthew Ray
  defaultLabels: ['development'],
};

// Issue type configurations
const ISSUE_TYPES = {
  feature: {
    prefix: '[FEATURE]',
    labels: ['feature', 'enhancement'],
    template: 'feature-request.md'
  },
  bug: {
    prefix: '[BUG]',
    labels: ['bug'],
    template: 'bug-report.md'
  },
  'tech-debt': {
    prefix: '[TECH-DEBT]',
    labels: ['technical-debt', 'refactoring'],
    template: 'technical-debt.md'
  },
  config: {
    prefix: '[CONFIG]',
    labels: ['configuration'],
    template: null
  },
  infra: {
    prefix: '[INFRA]',
    labels: ['infrastructure'],
    template: null
  },
  security: {
    prefix: '[SECURITY]',
    labels: ['security'],
    template: null
  },
  perf: {
    prefix: '[PERF]',
    labels: ['performance'],
    template: null
  },
  'ui-ux': {
    prefix: '[UI/UX]',
    labels: ['ui', 'ux'],
    template: null
  },
  db: {
    prefix: '[DB]',
    labels: ['database', 'migration'],
    template: null
  },
  integration: {
    prefix: '[INTEGRATION]',
    labels: ['integration'],
    template: null
  }
};

function showHelp() {
  console.log(`
Linear Issue Creation Script

Usage:
  node scripts/linear/create-issue.mjs [options]

Options:
  --type, -t <type>        Issue type (feature, bug, tech-debt, config, infra, security, perf, ui-ux, db, integration)
  --title, -n <title>      Issue title (without prefix)
  --description, -d <desc> Issue description
  --priority, -p <level>   Priority level (0-4, where 0=No priority, 1=Urgent, 2=High, 3=Normal, 4=Low)
  --labels, -l <labels>    Additional labels (comma-separated)
  --template, -T <file>    Use template file
  --help, -h               Show this help message

Examples:
  node scripts/linear/create-issue.mjs --type feature --title "Add user search" --description "Implement search functionality for users"
  node scripts/linear/create-issue.mjs --type bug --title "Fix login timeout" --priority 1
  node scripts/linear/create-issue.mjs --template feature-request.md

Available Types:
  ${Object.keys(ISSUE_TYPES).join(', ')}
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--type':
      case '-t':
        options.type = nextArg;
        i++;
        break;
      case '--title':
      case '-n':
        options.title = nextArg;
        i++;
        break;
      case '--description':
      case '-d':
        options.description = nextArg;
        i++;
        break;
      case '--priority':
      case '-p':
        options.priority = parseInt(nextArg);
        i++;
        break;
      case '--labels':
      case '-l':
        options.labels = nextArg.split(',').map(l => l.trim());
        i++;
        break;
      case '--template':
      case '-T':
        options.template = nextArg;
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
  if (!options.type && !options.template) {
    console.error('Error: Either --type or --template must be specified');
    showHelp();
    process.exit(1);
  }
  
  if (options.type && !ISSUE_TYPES[options.type]) {
    console.error(`Error: Unknown issue type: ${options.type}`);
    console.error(`Available types: ${Object.keys(ISSUE_TYPES).join(', ')}`);
    process.exit(1);
  }
  
  if (!options.title && !options.template) {
    console.error('Error: --title is required when not using --template');
    showHelp();
    process.exit(1);
  }
}

function loadTemplate(templateName) {
  try {
    const templatePath = join(__dirname, '../../.github/ISSUE_TEMPLATE', templateName);
    const content = readFileSync(templatePath, 'utf8');
    
    // Extract title and description from template
    const titleMatch = content.match(/title:\s*'([^']+)'/);
    const descriptionMatch = content.match(/## ([^\n]+)\n([\s\S]*?)(?=##|$)/);
    
    return {
      title: titleMatch ? titleMatch[1] : '',
      description: descriptionMatch ? descriptionMatch[2].trim() : content,
      content
    };
  } catch (error) {
    console.error(`Error loading template: ${error.message}`);
    process.exit(1);
  }
}

function createLinearIssue(options) {
  const issueType = ISSUE_TYPES[options.type];
  const title = options.template ? 
    loadTemplate(options.template).title : 
    `${issueType.prefix} ${options.title}`;
  
  const description = options.template ? 
    loadTemplate(options.template).description : 
    options.description || '';
  
  const labels = [
    ...issueType.labels,
    ...(options.labels || []),
    ...CONFIG.defaultLabels
  ];
  
  const issueData = {
    title,
    description,
    team: 'RAYTEL',
    assignee: 'Matthew Ray',
    labels,
    priority: options.priority || 3
  };
  
  console.log('Creating Linear issue with the following data:');
  console.log(JSON.stringify(issueData, null, 2));
  
  // Note: This would normally make an API call to Linear
  // For now, we'll just output the data that would be sent
  console.log('\nTo create this issue in Linear, use the Linear API or web interface with the above data.');
  console.log('\nOr use the Linear CLI:');
  console.log(`linear issue create --team RAYTEL --title "${title}" --description "${description}" --assignee "Matthew Ray" --labels "${labels.join(',')}" --priority ${options.priority || 3}`);
}

function main() {
  const options = parseArgs();
  validateOptions(options);
  
  if (options.template) {
    const template = loadTemplate(options.template);
    console.log('Template loaded:');
    console.log('Title:', template.title);
    console.log('Description:', template.description);
    console.log('\nTo create this issue, run:');
    console.log(`linear issue create --team RAYTEL --title "${template.title}" --description "${template.description}" --assignee "Matthew Ray"`);
  } else {
    createLinearIssue(options);
  }
}

main();
