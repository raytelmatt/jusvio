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

import { getFirebaseApp, getFirebaseAuth } from '../firebase';
import {
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
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
  async getCurrentUser(): Promise<BackendUser | null> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    if (user) {
      return {
        $id: user.uid,
        email: user.email || '',
        name: user.displayName || undefined,
        prefs: {},
      };
    }
    // Fallback to a one-shot auth state check
    return new Promise((resolve) => {
      const unsub = onAuthStateChanged(auth, (u) => {
        unsub();
        if (!u) return resolve(null);
        resolve({
          $id: u.uid,
          email: u.email || '',
          name: u.displayName || undefined,
          prefs: {},
        });
      });
    });
  }

  async get(): Promise<BackendUser | null> {
    return this.getCurrentUser();
  }

  async loginWithGoogle(successUrl: string, failureUrl: string): Promise<void> {
    void successUrl;
    void failureUrl;
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  }

  async loginWithEmailPassword(email: string, password: string): Promise<void> {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  }

  async logout(): Promise<void> {
    const auth = getFirebaseAuth();
    await signOut(auth);
  }

  async createJWT(): Promise<{ jwt: string }> {
    const auth = getFirebaseAuth();
    const user = auth.currentUser;
    const jwt = user ? await user.getIdToken() : '';
    return { jwt };
  }
}

class FirebaseDatabaseService implements BackendDatabaseService {
  constructor(private projectId: string) {}

  private isNetworkError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    
    const errorMessage = (error as { message?: string }).message || '';
    const errorCode = (error as { code?: string }).code || '';
    
    // Check for common network error patterns
    return (
      errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
      errorMessage.includes('ERR_NETWORK_CHANGED') ||
      errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
      errorMessage.includes('ERR_CONNECTION_REFUSED') ||
      errorMessage.includes('ERR_CONNECTION_TIMED_OUT') ||
      errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
      errorCode === 'unavailable' ||
      errorCode === 'deadline-exceeded' ||
      errorCode === 'permission-denied'
    );
  }

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
    
    try {
      const snap = await getDocs(q);
      let docs = snap.docs.map((docSnap) => {
        const data = (typeof docSnap.data === 'function' ? docSnap.data() : ({} as DocumentData)) ?? {};
        return { $id: docSnap.id, ...data } as T;
      });

      if (typeof offset === 'number' && offset > 0) {
        docs = docs.slice(offset);
      }

      return { total: docs.length, documents: docs };
    } catch (error) {
      // Handle network connectivity issues
      if (this.isNetworkError(error)) {
        console.error(`Network error accessing collection: ${collectionId}`, error);
        throw new Error('Network connectivity issue. Please check your internet connection and try again.');
      }
      throw error;
    }
  }

  async getDocument<T = BackendDocument>(
    _databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<T> {
    const db = getFirestore(getFirebaseApp());
    const ref = doc(db, collectionId, documentId);
    
    try {
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        console.error(`Document not found: collection="${collectionId}", id="${documentId}"`);
        throw new Error('Document not found');
      }
      return { $id: snap.id, ...snap.data() } as unknown as T;
    } catch (error) {
      // Handle network connectivity issues
      if (this.isNetworkError(error)) {
        console.error(`Network error accessing document: collection="${collectionId}", id="${documentId}"`, error);
        throw new Error('Network connectivity issue. Please check your internet connection and try again.');
      }
      throw error;
    }
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
