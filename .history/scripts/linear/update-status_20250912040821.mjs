#!/usr/bin/env node

/**
 * Linear Issue Status Update Script
 * 
 * This script helps update Linear issue status from command line
 * Usage: node scripts/linear/update-status.mjs [options]
 */

function showHelp() {
  console.log(`
Linear Issue Status Update Script

Usage:
  node scripts/linear/update-status.mjs [options]

Options:
  --issue, -i <id>         Linear issue ID (e.g., RAY-123)
  --status, -s <status>    New status (Backlog, Todo, In Progress, In Review, Done, Cancelled)
  --comment, -c <comment>  Optional comment to add with status update
  --help, -h               Show this help message

Status Options:
  - Backlog: Issue is in backlog
  - Todo: Issue is ready to be worked on
  - In Progress: Issue is currently being worked on
  - In Review: Issue is under review
  - Done: Issue is completed
  - Cancelled: Issue is cancelled

Examples:
  node scripts/linear/update-status.mjs --issue RAY-123 --status "In Progress"
  node scripts/linear/update-status.mjs --issue RAY-123 --status "Done" --comment "Feature completed and deployed"
  node scripts/linear/update-status.mjs -i RAY-123 -s "In Review" -c "Ready for code review"
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];
    
    switch (arg) {
      case '--issue':
      case '-i':
        options.issue = nextArg;
        i++;
        break;
      case '--status':
      case '-s':
        options.status = nextArg;
        i++;
        break;
      case '--comment':
      case '-c':
        options.comment = nextArg;
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
  if (!options.issue) {
    console.error('Error: --issue is required');
    showHelp();
    process.exit(1);
  }
  
  if (!options.status) {
    console.error('Error: --status is required');
    showHelp();
    process.exit(1);
  }
  
  const validStatuses = ['Backlog', 'Todo', 'In Progress', 'In Review', 'Done', 'Cancelled'];
  if (!validStatuses.includes(options.status)) {
    console.error(`Error: Invalid status: ${options.status}`);
    console.error(`Valid statuses: ${validStatuses.join(', ')}`);
    process.exit(1);
  }
  
  // Validate issue ID format
  if (!options.issue.match(/^RAY-\d+$/)) {
    console.error(`Error: Invalid issue ID format: ${options.issue}`);
    console.error('Expected format: RAY-123');
    process.exit(1);
  }
}

function updateLinearIssue(options) {
  console.log(`Updating Linear issue ${options.issue} to status: ${options.status}`);
  
  if (options.comment) {
    console.log(`Adding comment: ${options.comment}`);
  }
  
  // Note: This would normally make an API call to Linear
  // For now, we'll just output the data that would be sent
  const updateData = {
    issueId: options.issue,
    status: options.status,
    comment: options.comment || null
  };
  
  console.log('\nUpdate data:');
  console.log(JSON.stringify(updateData, null, 2));
  
  console.log('\nTo update this issue in Linear, use the Linear API or web interface.');
  console.log('\nOr use the Linear CLI:');
  if (options.comment) {
    console.log(`linear issue update ${options.issue} --state "${options.status}" --comment "${options.comment}"`);
  } else {
    console.log(`linear issue update ${options.issue} --state "${options.status}"`);
  }
}

function main() {
  const options = parseArgs();
  validateOptions(options);
  updateLinearIssue(options);
}

main();
