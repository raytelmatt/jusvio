import type {
  BackendService,
  BackendAuthService,
  BackendDatabaseService,
  BackendStorageService,
  BackendUser,
  BackendDocument,
  BackendFile,
  BackendListResponse,
  BackendConfig
} from './types';

import { getFirebaseApp } from '../firebase';
import { checkNetworkConnectivity, waitForNetworkConnectivity, getFirebaseErrorMessage } from '../network-utils';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  connectAuthEmulator,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query as fsQuery,
  where,
  orderBy,
  limit as fsLimit,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getMetadata,
  deleteObject,
} from 'firebase/storage';

type QueryDescriptor =
  | { type: 'where'; op: '==' | '!=' | '>' | '>=' | '<' | '<=' | 'in'; attribute: string; value: unknown }
  | { type: 'order'; attribute: string; direction: 'asc' | 'desc' }
  | { type: 'limit'; value: number }
  | { type: 'offset'; value: number };

function tryParseQuery(raw?: string): QueryDescriptor | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as QueryDescriptor;
    if (typeof parsed === 'object' && parsed && 'type' in parsed) return parsed;
  } catch {
    return null;
  }
  return null;
}

class FirebaseAuthService implements BackendAuthService {
  private maxRetries = 3;
  private retryDelay = 1000;

  private async withRetry<T>(operation: () => Promise<T>, context: string): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Log the error for debugging
        console.warn(`${context} attempt ${attempt}/${this.maxRetries} failed:`, lastError.message);
        
        // Don't retry on certain errors
        if (lastError.message.includes('auth/invalid-email') || 
            lastError.message.includes('auth/user-not-found') ||
            lastError.message.includes('auth/wrong-password') ||
            lastError.message.includes('auth/too-many-requests')) {
          throw lastError;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }
    
    throw lastError!;
  }

  async getCurrentUser(): Promise<BackendUser | null> {
    return this.withRetry(async () => {
      const auth = getAuth(getFirebaseApp());
      const user = auth.currentUser;
      
      if (user) {
        return {
          $id: user.uid,
          email: user.email || '',
          name: user.displayName || undefined,
          prefs: {},
        };
      }
      
      // Fallback to a one-shot auth state check with timeout
      return new Promise<BackendUser | null>((resolve, reject) => {
        const timeout = setTimeout(() => {
          unsub();
          reject(new Error('Auth state check timeout'));
        }, 10000); // 10 second timeout
        
        const unsub = onAuthStateChanged(auth, (u) => {
          clearTimeout(timeout);
          unsub();
          if (!u) return resolve(null);
          resolve({
            $id: u.uid,
            email: u.email || '',
            name: u.displayName || undefined,
            prefs: {},
          });
        }, (error) => {
          clearTimeout(timeout);
          unsub();
          reject(error);
        });
      });
    }, 'getCurrentUser');
  }

  async get(): Promise<BackendUser | null> {
    return this.getCurrentUser();
  }

  async loginWithGoogle(successUrl: string, failureUrl: string): Promise<void> {
    return this.withRetry(async () => {
      void successUrl;
      void failureUrl;
      const auth = getAuth(getFirebaseApp());
      const provider = new GoogleAuthProvider();
      
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      await signInWithRedirect(auth, provider);
    }, 'loginWithGoogle');
  }

  async loginWithEmailPassword(email: string, password: string): Promise<void> {
    return this.withRetry(async () => {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Check network connectivity before attempting login
      const hasConnectivity = await checkNetworkConnectivity();
      if (!hasConnectivity) {
        console.warn('Network connectivity check failed, attempting to wait for connection...');
        const connected = await waitForNetworkConnectivity(10000);
        if (!connected) {
          throw new Error('No internet connection. Please check your network and try again.');
        }
      }
      
      const auth = getAuth(getFirebaseApp());
      
      try {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        
        if (!result.user) {
          throw new Error('Login failed: No user returned from Firebase');
        }
        
        // Verify the user is properly authenticated
        if (!result.user.uid) {
          throw new Error('Login failed: Invalid user data');
        }
        
        console.log('Login successful for user:', result.user.email);
      } catch (error) {
        // Transform Firebase errors into user-friendly messages
        const friendlyMessage = getFirebaseErrorMessage(error);
        throw new Error(friendlyMessage);
      }
    }, 'loginWithEmailPassword');
  }

  async logout(): Promise<void> {
    const auth = getAuth(getFirebaseApp());
    await signOut(auth);
  }

  async createJWT(): Promise<{ jwt: string }> {
    const auth = getAuth(getFirebaseApp());
    const user = auth.currentUser;
    const jwt = user ? await user.getIdToken() : '';
    return { jwt };
  }
}

class FirebaseDatabaseService implements BackendDatabaseService {
  constructor(private projectId: string) {}

  async listDocuments<T = BackendDocument>(
    _databaseId: string,
    collectionId: string,
    queries: string[] = []
  ): Promise<BackendListResponse<T>> {
    const db = getFirestore(getFirebaseApp());
    const colRef = collection(db, collectionId);

    const descriptors: QueryDescriptor[] = queries
      .map((q) => tryParseQuery(q))
      .filter((x): x is QueryDescriptor => Boolean(x));

    const constraints: QueryConstraint[] = [];
    let offset: number | undefined;

    for (const d of descriptors) {
      if (d.type === 'where') {
        constraints.push(where(d.attribute, d.op, d.value));
      } else if (d.type === 'order') {
        constraints.push(orderBy(d.attribute, d.direction));
      } else if (d.type === 'limit') {
        constraints.push(fsLimit(d.value));
      } else if (d.type === 'offset') {
        offset = d.value;
      }
    }

    const q = constraints.length > 0 ? fsQuery(colRef, ...constraints) : colRef;
    const snap = await getDocs(q);
    let docs = snap.docs.map((docSnap) => {
      const data = (typeof docSnap.data === 'function' ? docSnap.data() : ({} as DocumentData)) ?? {};
      return { $id: docSnap.id, ...data } as T;
    });

    if (typeof offset === 'number' && offset > 0) {
      docs = docs.slice(offset);
    }

    return { total: docs.length, documents: docs };
  }

  async getDocument<T = BackendDocument>(
    _databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<T> {
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, collectionId, documentId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Document not found');
    return { $id: snap.id, ...snap.data() } as unknown as T;
  }

  async createDocument<T = BackendDocument>(
    _databaseId: string,
    collectionId: string,
    documentId: string,
    data: Partial<T>,
    _permissions?: string[]
  ): Promise<T> {
    void _permissions;
    const db = getFirestore(getFirebaseApp());
    const now = new Date().toISOString();
    const base = { ...data, created_at: now, updated_at: now } as Record<string, unknown>;

    if (documentId === 'unique()') {
      const ref = await addDoc(collection(db, collectionId), base);
      const snap = await getDoc(ref);
      return { $id: ref.id, id: ref.id, ...snap.data() } as unknown as T;
    } else {
      const ref = doc(db, collectionId, documentId);
      await setDoc(ref, base, { merge: true });
      const snap = await getDoc(ref);
      return { $id: ref.id, id: ref.id, ...snap.data() } as unknown as T;
    }
  }

  async updateDocument<T = BackendDocument>(
    _databaseId: string,
    collectionId: string,
    documentId: string,
    data: Partial<T>,
    _permissions?: string[]
  ): Promise<T> {
    void _permissions;
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, collectionId, documentId);
    const now = new Date().toISOString();
    await updateDoc(ref, { ...(data as Record<string, unknown>), updated_at: now });
    const snap = await getDoc(ref);
    return { $id: ref.id, id: ref.id, ...snap.data() } as unknown as T;
  }

  async deleteDocument(
    _databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<void> {
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, collectionId, documentId);
    await deleteDoc(ref);
  }
}

class FirebaseStorageService implements BackendStorageService {
  constructor(private bucket?: string) {}

  async createFile(bucketId: string, fileId: string, file: File): Promise<BackendFile> {
    const storage = getStorage(getFirebaseApp(), this.bucket ? `gs://${this.bucket}` : undefined);
    const cryptoApi = typeof globalThis.crypto !== 'undefined' ? globalThis.crypto : undefined;
    const id = fileId === 'unique()'
      ? (typeof cryptoApi?.randomUUID === 'function'
        ? cryptoApi.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
      : fileId;
    const path = `${bucketId}/${id}`;
    const ref = storageRef(storage, path);
    const res = await uploadBytes(ref, file);
    const meta = await getMetadata(ref);
    return {
      $id: id,
      name: meta.name,
      mimeType: meta.contentType || file.type || 'application/octet-stream',
      sizeOriginal: res.metadata.size ? Number(res.metadata.size) : file.size,
      $createdAt: new Date().toISOString(),
    };
  }

  async getFile(bucketId: string, fileId: string): Promise<BackendFile> {
    const storage = getStorage(getFirebaseApp(), this.bucket ? `gs://${this.bucket}` : undefined);
    const ref = storageRef(storage, `${bucketId}/${fileId}`);
    const meta = await getMetadata(ref);
    return {
      $id: fileId,
      name: meta.name,
      mimeType: meta.contentType || 'application/octet-stream',
      sizeOriginal: Number(meta.size || 0),
      $createdAt: meta.timeCreated || new Date().toISOString(),
    };
  }

  async deleteFile(bucketId: string, fileId: string): Promise<void> {
    const storage = getStorage(getFirebaseApp(), this.bucket ? `gs://${this.bucket}` : undefined);
    const ref = storageRef(storage, `${bucketId}/${fileId}`);
    await deleteObject(ref);
  }

  getFilePreview(bucketId: string, fileId: string, width?: number, height?: number): string {
    void width;
    void height;
    return this.getFileDownload(bucketId, fileId);
  }

  getFileView(bucketId: string, fileId: string): string {
    return this.getFileDownload(bucketId, fileId);
  }

  getFileDownload(bucketId: string, fileId: string): string {
    const bucket = this.bucket || 'jusivo.appspot.com';
    const path = encodeURIComponent(`${bucketId}/${fileId}`);
    // Note: if your bucket is not public, consider storing full download URLs at write time
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${path}?alt=media`;
  }
}

export class FirebaseBackendService implements BackendService {
  public auth: BackendAuthService;
  public database: BackendDatabaseService;
  public storage: BackendStorageService;

  public Query = {
    equal(attribute: string, value: unknown) {
      return JSON.stringify({ type: 'where', op: '==', attribute, value });
    },
    notEqual(attribute: string, value: unknown) {
      return JSON.stringify({ type: 'where', op: '!=', attribute, value });
    },
    lessThan(attribute: string, value: unknown) {
      return JSON.stringify({ type: 'where', op: '<', attribute, value });
    },
    lessThanEqual(attribute: string, value: unknown) {
      return JSON.stringify({ type: 'where', op: '<=', attribute, value });
    },
    greaterThan(attribute: string, value: unknown) {
      return JSON.stringify({ type: 'where', op: '>', attribute, value });
    },
    greaterThanEqual(attribute: string, value: unknown) {
      return JSON.stringify({ type: 'where', op: '>=', attribute, value });
    },
    in(attribute: string, values: unknown[]) {
      return JSON.stringify({ type: 'where', op: 'in', attribute, value: values });
    },
    search(attribute: string, value: string) {
      // Firestore has no full-text search natively; treat as equality for now
      return JSON.stringify({ type: 'where', op: '==', attribute, value });
    },
    orderAsc(attribute: string) {
      return JSON.stringify({ type: 'order', attribute, direction: 'asc' });
    },
    orderDesc(attribute: string) {
      return JSON.stringify({ type: 'order', attribute, direction: 'desc' });
    },
    limit(limit: number) {
      return JSON.stringify({ type: 'limit', value: limit });
    },
    offset(offset: number) {
      return JSON.stringify({ type: 'offset', value: offset });
    },
  };

  constructor(config: BackendConfig) {
    // Allow running with default values to avoid blank pages in dev
    const effectiveProjectId = config.projectId || 'jusivo';
    const effectiveBucket = config.storageBucket || 'jusivo.appspot.com';
    // Ensure the app is initialized (lib/firebase.ts holds config)
    getFirebaseApp();

    this.auth = new FirebaseAuthService();
    this.database = new FirebaseDatabaseService(effectiveProjectId);
    this.storage = new FirebaseStorageService(effectiveBucket as string | undefined);
  }

  setJWT(jwt: string | null): void {
    void jwt;
    // No-op: Firebase SDK manages auth state automatically in the browser
  }
}
