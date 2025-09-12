#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = './src/react-app/pages/CriminalIntakeForm.tsx';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define patterns to fix accessibility issues

// 1. Fix input elements that are missing id attributes
const inputPatterns = [
  // Pattern for inputs with relationship field
  {
    search: /(\s+)(<input\s+type="text"\s+value={formData\.emergency_contact\.relationship}[\s\S]*?className="[^"]*")\s*>/g,
    replace: '$1<input\n$1  id="emergency_contact_relationship"\n$1  type="text"\n$1  value={formData.emergency_contact.relationship}'
  }
];

// 2. Fix all input elements systematically
const fixes = [
  // Emergency contact relationship
  {
    labelSearch: /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Relationship \*\s*<\/label>/,
    labelReplace: '<label htmlFor="emergency_contact_relationship" className="block text-sm font-medium text-gray-700 mb-1">\n                      Relationship *\n                    </label>',
    inputSearch: /<input\s+type="text"\s+value={formData\.emergency_contact\.relationship}/,
    inputReplace: '<input\n                      id="emergency_contact_relationship"\n                      type="text"\n                      value={formData.emergency_contact.relationship}'
  },
  // Emergency contact mobile phone
  {
    labelSearch: /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Mobile Phone\s*<\/label>/,
    labelReplace: '<label htmlFor="emergency_contact_mobile" className="block text-sm font-medium text-gray-700 mb-1">\n                        Mobile Phone\n                      </label>',
    inputSearch: /<input\s+type="tel"\s+value={formData\.emergency_contact\.mobile_phone}/,
    inputReplace: '<input\n                        id="emergency_contact_mobile"\n                        type="tel"\n                        value={formData.emergency_contact.mobile_phone}'
  },
  // Emergency contact home phone  
  {
    labelSearch: /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Home Phone\s*<\/label>/,
    labelReplace: '<label htmlFor="emergency_contact_home" className="block text-sm font-medium text-gray-700 mb-1">\n                        Home Phone\n                      </label>',
    inputSearch: /<input\s+type="tel"\s+value={formData\.emergency_contact\.home_phone}/,
    inputReplace: '<input\n                        id="emergency_contact_home"\n                        type="tel"\n                        value={formData.emergency_contact.home_phone}'
  },
  // Emergency contact email
  {
    labelSearch: /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Email\s*<\/label>/,
    labelReplace: '<label htmlFor="emergency_contact_email" className="block text-sm font-medium text-gray-700 mb-1">\n                        Email\n                      </label>',
    inputSearch: /<input\s+type="email"\s+value={formData\.emergency_contact\.email}/,
    inputReplace: '<input\n                        id="emergency_contact_email"\n                        type="email"\n                        value={formData.emergency_contact.email}'
  },
  // Employment Status select
  {
    labelSearch: /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Employment Status\s*<\/label>/,
    labelReplace: '<label htmlFor="employment_status" className="block text-sm font-medium text-gray-700 mb-1">\n                    Employment Status\n                  </label>',
    inputSearch: /<select\s+value={formData\.employment_status}/,
    inputReplace: '<select\n                    id="employment_status"\n                    value={formData.employment_status}'
  },
  // Employer Name
  {
    labelSearch: /<label className="block text-sm font-medium text-gray-700 mb-1">\s*Employer Name\s*<\/label>/,
    labelReplace: '<label htmlFor="employer_name" className="block text-sm font-medium text-gray-700 mb-1">\n                    Employer Name\n                  </label>',
    inputSearch: /<input\s+type="text"\s+value={formData\.employer_name}/,
    inputReplace: '<input\n                    id="employer_name"\n                    type="text"\n                    value={formData.employer_name}'
  }
];

// Apply all fixes
fixes.forEach((fix, index) => {
  if (fix.labelSearch && fix.labelReplace) {
    content = content.replace(fix.labelSearch, fix.labelReplace);
  }
  if (fix.inputSearch && fix.inputReplace) {
    content = content.replace(fix.inputSearch, fix.inputReplace);
  }
});

// Write the fixed content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Accessibility fixes applied to CriminalIntakeForm.tsx');
