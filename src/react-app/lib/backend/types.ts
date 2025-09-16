
export interface BackendUser {
  $id: string;
  email: string;
  name?: string;
  prefs?: Record<string, unknown>;
}

export interface BackendDocument {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  [key: string]: unknown;
}

// Legacy alias retained for transitional normalization code
export type LegacyDocument = BackendDocument;

export interface BackendFile {
  $id: string;
  name: string;
  mimeType: string;
  sizeOriginal: number;
  $createdAt: string;
}

// Query builder API exposed to callers; returns string-encoded descriptors
export interface BackendQueryApi {
  equal(attribute: string, value: unknown): string;
  notEqual(attribute: string, value: unknown): string;
  lessThan(attribute: string, value: unknown): string;
  lessThanEqual(attribute: string, value: unknown): string;
  greaterThan(attribute: string, value: unknown): string;
  greaterThanEqual(attribute: string, value: unknown): string;
  in(attribute: string, values: unknown[]): string;
  search(attribute: string, value: string): string;
  orderAsc(attribute: string): string;
  orderDesc(attribute: string): string;
  limit(limit: number): string;
  offset(offset: number): string;
}

export interface BackendListResponse<T> {
  total: number;
  documents: T[];
}

export interface BackendAuthService {
  getCurrentUser(): Promise<BackendUser | null>;
  get(): Promise<BackendUser | null>; // Legacy compatibility
  loginWithGoogle(successUrl: string, failureUrl: string): Promise<void>;
  loginWithEmailPassword(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  createJWT(): Promise<{ jwt: string }>;
}

export interface BackendDatabaseService {
  listDocuments<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    queries?: string[]
  ): Promise<BackendListResponse<T>>;
  
  getDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<T>;
  
  createDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ): Promise<T>;
  
  updateDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ): Promise<T>;
  
  deleteDocument(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<void>;
}

export interface BackendStorageService {
  createFile(
    bucketId: string,
    fileId: string,
    file: File
  ): Promise<BackendFile>;
  
  getFile(bucketId: string, fileId: string): Promise<BackendFile>;
  
  deleteFile(bucketId: string, fileId: string): Promise<void>;
  
  getFilePreview(
    bucketId: string,
    fileId: string,
    width?: number,
    height?: number
  ): string;
  
  getFileView(bucketId: string, fileId: string): string; // Legacy compatibility
  
  getFileDownload(bucketId: string, fileId: string): string;
}

export interface BackendService {
  auth: BackendAuthService;
  database: BackendDatabaseService;
  storage: BackendStorageService;

  setJWT(jwt: string | null): void;

  Query: BackendQueryApi;
}

export interface BackendConfig {
  projectId: string;
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  storageBucket?: string;
  [key: string]: unknown;
}

export const DATABASE_ID = 'jusivo';

export const COLLECTIONS = {
  userProfiles: 'user_profiles',
  clients: 'clients',
  matters: 'matters',
  mattersMeta: 'matters_meta',
  hearings: 'hearings',
  intakes: 'intakes',
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
} as const;

export const BUCKETS = {
  documents: 'documents',
} as const;
