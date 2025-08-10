import { Client, Account, Databases, Storage } from 'appwrite';

const endpoint = (import.meta as any).env?.VITE_APPWRITE_ENDPOINT as string;
const projectId = (import.meta as any).env?.VITE_APPWRITE_PROJECT_ID as string;

export const appwriteClient = new Client();

if (endpoint && projectId) {
  appwriteClient.setEndpoint(endpoint).setProject(projectId);
}

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const storage = new Storage(appwriteClient);

export const DATABASE_ID = 'jusivo';
export const COLLECTIONS = {
  userProfiles: 'user_profiles',
  clients: 'clients',
  matters: 'matters',
  documents: 'documents',
  documentTemplates: 'document_templates',
  documentVersions: 'document_versions',
  deadlines: 'deadlines',
  timeEntries: 'time_entries',
  invoices: 'invoices',
  communications: 'communications',
  deadlineNotes: 'deadline_notes',
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
      // @ts-ignore - SDK accepts empty string
      appwriteClient.setJWT('');
    }
  } catch {}
}


