
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

export interface BackendQuery {
  equal(attribute: string, value: unknown): BackendQuery;
  notEqual(attribute: string, value: unknown): BackendQuery;
  lessThan(attribute: string, value: unknown): BackendQuery;
  greaterThan(attribute: string, value: unknown): BackendQuery;
  search(attribute: string, value: string): BackendQuery;
  orderAsc(attribute: string): BackendQuery;
  orderDesc(attribute: string): BackendQuery;
  limit(limit: number): BackendQuery;
  offset(offset: number): BackendQuery;
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
  
  Query: {
    equal(attribute: string, value: unknown): unknown;
    notEqual(attribute: string, value: unknown): unknown;
    lessThan(attribute: string, value: unknown): unknown;
    greaterThan(attribute: string, value: unknown): unknown;
    search(attribute: string, value: string): unknown;
    orderAsc(attribute: string): unknown;
    orderDesc(attribute: string): unknown;
    limit(limit: number): unknown;
    offset(offset: number): unknown;
  };
}

export interface BackendConfig {
  provider: 'firebase' | 'supabase' | 'custom';
  endpoint?: string;
  projectId: string;
  apiKey?: string;
  [key: string]: unknown;
}

export const DATABASE_ID = 'jusivo';

export const COLLECTIONS = {
  userProfiles: 'user_profiles',
  clients: 'clients',
  matters: 'matters',
  mattersMeta: 'matters_meta',
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
} as const;

export const BUCKETS = {
  documents: 'documents',
} as const;
