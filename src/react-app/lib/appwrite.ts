import { Client, Account, Databases, Storage } from 'appwrite';

const endpoint = (import.meta.env?.VITE_APPWRITE_ENDPOINT as string) || 'https://nyc.cloud.appwrite.io/v1';
const projectId = (import.meta.env?.VITE_APPWRITE_PROJECT_ID as string) || '6897443a0034c54b3fd8';

export const appwriteClient = new Client().setEndpoint(endpoint).setProject(projectId);

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const storage = new Storage(appwriteClient);

export const DATABASE_ID = 'jusivo';
export const COLLECTIONS = {
  userProfiles: 'user_profiles',
  clients: 'clients',
  matters: 'matters',
  hearings: 'hearings',
  documents: 'documents',
  documentTemplates: 'document_templates',
  documentVersions: 'document_versions',
  deadlines: 'deadlines',
  timeEntries: 'time_entries',
  tasks: 'tasks',
  invoices: 'invoices',
  payments: 'payments',
  communications: 'communications',
  deadlineNotes: 'deadline_notes',
  notifications: 'notifications',
};

export const BUCKETS = {
  documents: 'documents',
};

// Allow auth layer to inject a JWT to avoid cross-site cookie issues
export function setClientJWT(jwt: string | null) {
  try {
    if (jwt) {
      appwriteClient.setJWT(jwt);
    } else {
      // Clearing JWT: set empty string to drop Authorization header
      appwriteClient.setJWT('');
    }
  } catch {
    // Ignore JWT setting errors
  }
}


