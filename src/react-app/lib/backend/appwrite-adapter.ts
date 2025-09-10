import { Client, Account, Databases, Storage, Query } from 'appwrite';
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

class AppwriteAuthService implements BackendAuthService {
  constructor(private account: Account) {}

  async getCurrentUser(): Promise<BackendUser | null> {
    try {
      const user = await this.account.get();
      return {
        $id: user.$id,
        email: user.email,
        name: user.name,
        prefs: user.prefs
      };
    } catch {
      return null;
    }
  }

  async get(): Promise<BackendUser | null> {
    return this.getCurrentUser();
  }

  async loginWithGoogle(successUrl: string, failureUrl: string): Promise<void> {
    await this.account.createOAuth2Session('google', successUrl, failureUrl);
  }

  async loginWithEmailPassword(email: string, password: string): Promise<void> {
    await this.account.createEmailSession(email, password);
  }

  async logout(): Promise<void> {
    await this.account.deleteSession('current');
  }

  async createJWT(): Promise<{ jwt: string }> {
    return await this.account.createJWT();
  }
}

class AppwriteDatabaseService implements BackendDatabaseService {
  constructor(private databases: Databases) {}

  async listDocuments<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    queries?: string[]
  ): Promise<BackendListResponse<T>> {
    const response = await this.databases.listDocuments(databaseId, collectionId, queries);
    return {
      total: response.total,
      documents: response.documents as T[]
    };
  }

  async getDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<T> {
    return await this.databases.getDocument(databaseId, collectionId, documentId) as T;
  }

  async createDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ): Promise<T> {
    return await this.databases.createDocument(databaseId, collectionId, documentId, data, permissions) as T;
  }

  async updateDocument<T = BackendDocument>(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: Partial<T>,
    permissions?: string[]
  ): Promise<T> {
    return await this.databases.updateDocument(databaseId, collectionId, documentId, data, permissions) as T;
  }

  async deleteDocument(
    databaseId: string,
    collectionId: string,
    documentId: string
  ): Promise<void> {
    await this.databases.deleteDocument(databaseId, collectionId, documentId);
  }
}

class AppwriteStorageService implements BackendStorageService {
  constructor(private storage: Storage) {}

  async createFile(bucketId: string, fileId: string, file: File): Promise<BackendFile> {
    const response = await this.storage.createFile(bucketId, fileId, file);
    return {
      $id: response.$id,
      name: response.name,
      mimeType: response.mimeType,
      sizeOriginal: response.sizeOriginal,
      $createdAt: response.$createdAt
    };
  }

  async getFile(bucketId: string, fileId: string): Promise<BackendFile> {
    const response = await this.storage.getFile(bucketId, fileId);
    return {
      $id: response.$id,
      name: response.name,
      mimeType: response.mimeType,
      sizeOriginal: response.sizeOriginal,
      $createdAt: response.$createdAt
    };
  }

  async deleteFile(bucketId: string, fileId: string): Promise<void> {
    await this.storage.deleteFile(bucketId, fileId);
  }

  getFilePreview(bucketId: string, fileId: string, width?: number, height?: number): string {
    return this.storage.getFilePreview(bucketId, fileId, width, height).toString();
  }

  getFileView(bucketId: string, fileId: string): string {
    return this.storage.getFileView(bucketId, fileId).toString();
  }

  getFileDownload(bucketId: string, fileId: string): string {
    return this.storage.getFileDownload(bucketId, fileId).toString();
  }
}

export class AppwriteBackendService implements BackendService {
  private client: Client;
  public auth: BackendAuthService;
  public database: BackendDatabaseService;
  public storage: BackendStorageService;
  public Query = Query;

  constructor(config: BackendConfig) {
    if (!config.endpoint || !config.projectId) {
      throw new Error('Appwrite backend requires endpoint and projectId');
    }

    this.client = new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.projectId);

    const account = new Account(this.client);
    const databases = new Databases(this.client);
    const storage = new Storage(this.client);

    this.auth = new AppwriteAuthService(account);
    this.database = new AppwriteDatabaseService(databases);
    this.storage = new AppwriteStorageService(storage);
  }

  setJWT(jwt: string | null): void {
    try {
      if (jwt) {
        this.client.setJWT(jwt);
      } else {
        this.client.setJWT('');
      }
    } catch {
      // Ignore JWT setting errors
    }
  }
}
