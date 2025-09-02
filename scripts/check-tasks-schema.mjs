import { Client, Databases } from 'node-appwrite';

const ENDPOINT = process.env.APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID || '6897443a0034c54b3fd8';
const API_KEY = process.env.APPWRITE_API_KEY || 'standard_4c7656c30877f2e13308be0a006b984d26a0231a3b1e530609ac8ab859bc9ed63cbb0ad3ad6c8478589dfdbc86d0c8b5815f77ed31b4a2e1dded6309a983a20d9f810cdfc293a2d203dfdbd008edab0569c3ca995bca79bbc8607b6d7a63e8a175160276d63e2ebf040bd3773c4d59e8b5587d5f78932a7587a1f01b55784a62';

const DATABASE_ID = 'jusivo';

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT_ID).setKey(API_KEY);
const databases = new Databases(client);

async function checkTasksSchema() {
  try {
    console.log('Checking tasks collection schema...');
    
    // List all attributes in the tasks collection
    const attributes = await databases.listAttributes(DATABASE_ID, 'tasks');
    
    console.log('\nCurrent tasks collection attributes:');
    console.log('=====================================');
    
    attributes.attributes.forEach(attr => {
      console.log(`- ${attr.key}: ${attr.type} (required: ${attr.required}, array: ${attr.array || false})`);
    });
    
    console.log(`\nTotal attributes: ${attributes.attributes.length}`);
    
    // Check if description field exists
    const hasDescription = attributes.attributes.some(attr => attr.key === 'description');
    console.log(`\nHas description field: ${hasDescription ? 'YES' : 'NO'}`);
    
    // Check if assignee_ids field exists
    const hasAssigneeIds = attributes.attributes.some(attr => attr.key === 'assignee_ids');
    console.log(`Has assignee_ids field: ${hasAssigneeIds ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('Error checking tasks schema:', error);
  }
}

checkTasksSchema();
