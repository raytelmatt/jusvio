import { describe, it, expect, vi, beforeEach } from 'vitest';
import { normalizeFirebaseClient, type FirebaseClient } from '../client-utils';

// Mock the backend module
vi.mock('../backend', () => ({
  databases: {
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
  DATABASE_ID: 'test-db',
  COLLECTIONS: {
    clients: 'clients',
    matters: 'matters',
    documents: 'documents',
    invoices: 'invoices',
    deadlines: 'deadlines',
    hearings: 'hearings',
    time_entries: 'time_entries',
    communications: 'communications',
  },
}));

describe('client-utils', () => {
  describe('normalizeFirebaseClient', () => {
    it('should normalize a complete Firebase client document', () => {
      const firebaseDoc: FirebaseClient = {
        $id: 'client-123',
        $createdAt: '2024-01-01T00:00:00Z',
        $updatedAt: '2024-01-02T00:00:00Z',
        client_number: 'CL-001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1980-01-01',
        ssn_last4: '1234',
        phones: JSON.stringify([{ type: 'Mobile', number: '555-0100' }]),
        email: 'john.doe@example.com',
        address: JSON.stringify({ street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' }),
        emergency_contact: JSON.stringify({ name: 'Jane Doe', phone: '555-0101' }),
        preferred_contact_method: 'Email' as const,
        notifications_opt_in: true,
        portal_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const normalized = normalizeFirebaseClient(firebaseDoc);

      expect(normalized).toEqual({
        $id: 'client-123',
        id: 'client-123',
        $createdAt: '2024-01-01T00:00:00Z',
        $updatedAt: '2024-01-02T00:00:00Z',
        client_number: 'CL-001',
        first_name: 'John',
        last_name: 'Doe',
        date_of_birth: '1980-01-01',
        ssn_last4: '1234',
        phones: JSON.stringify([{ type: 'Mobile', number: '555-0100' }]),
        email: 'john.doe@example.com',
        address: JSON.stringify({ street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' }),
        emergency_contact: JSON.stringify({ name: 'Jane Doe', phone: '555-0101' }),
        preferred_contact_method: 'Email',
        notifications_opt_in: true,
        portal_enabled: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      });
    });

    it('should handle missing optional fields', () => {
      const firebaseDoc: FirebaseClient = {
        $id: 'client-123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const normalized = normalizeFirebaseClient(firebaseDoc);

      expect(normalized.id).toBe('client-123');
      expect(normalized.first_name).toBe('John');
      expect(normalized.last_name).toBe('Doe');
      expect(normalized.client_number).toBeNull();
      expect(normalized.date_of_birth).toBeNull();
      expect(normalized.ssn_last4).toBeNull();
      expect(normalized.phones).toBeNull();
      expect(normalized.email).toBeNull();
      expect(normalized.address).toBeNull();
      expect(normalized.emergency_contact).toBeNull();
      expect(normalized.preferred_contact_method).toBeNull();
      expect(normalized.notifications_opt_in).toBe(false);
      expect(normalized.portal_enabled).toBe(false);
      expect(normalized.created_at).toBeTruthy();
      expect(normalized.updated_at).toBeTruthy();
    });

    it('should convert non-string first_name to string', () => {
      const firebaseDoc: FirebaseClient = {
        $id: 'client-123',
        first_name: null,
        last_name: undefined,
      };

      const normalized = normalizeFirebaseClient(firebaseDoc);

      expect(normalized.first_name).toBe('');
      expect(normalized.last_name).toBe('');
    });

    it('should handle boolean conversions correctly', () => {
      const doc1: FirebaseClient = {
        $id: 'client-1',
        first_name: 'John',
        last_name: 'Doe',
        notifications_opt_in: true,
        portal_enabled: false,
      };

      const doc2: FirebaseClient = {
        $id: 'client-2',
        first_name: 'Jane',
        last_name: 'Smith',
        notifications_opt_in: 0,
        portal_enabled: 1,
      };

      const normalized1 = normalizeFirebaseClient(doc1);
      const normalized2 = normalizeFirebaseClient(doc2);

      expect(normalized1.notifications_opt_in).toBe(true);
      expect(normalized1.portal_enabled).toBe(false);
      expect(normalized2.notifications_opt_in).toBe(false);
      expect(normalized2.portal_enabled).toBe(true);
    });

    it('should use $id as id', () => {
      const firebaseDoc: FirebaseClient = {
        $id: 'unique-firebase-id',
        first_name: 'Test',
        last_name: 'User',
      };

      const normalized = normalizeFirebaseClient(firebaseDoc);

      expect(normalized.id).toBe('unique-firebase-id');
      expect(normalized.$id).toBe('unique-firebase-id');
    });

    it('should preserve timestamp fields', () => {
      const createdAt = '2024-01-01T10:30:00Z';
      const updatedAt = '2024-01-02T15:45:00Z';
      
      const firebaseDoc: FirebaseClient = {
        $id: 'client-123',
        $createdAt: createdAt,
        $updatedAt: updatedAt,
        first_name: 'John',
        last_name: 'Doe',
        created_at: createdAt,
        updated_at: updatedAt,
      };

      const normalized = normalizeFirebaseClient(firebaseDoc);

      expect(normalized.$createdAt).toBe(createdAt);
      expect(normalized.$updatedAt).toBe(updatedAt);
      expect(normalized.created_at).toBe(createdAt);
      expect(normalized.updated_at).toBe(updatedAt);
    });

    it('should handle all contact methods', () => {
      const methods: Array<'Email' | 'Phone' | 'SMS'> = ['Email', 'Phone', 'SMS'];
      
      methods.forEach(method => {
        const firebaseDoc: FirebaseClient = {
          $id: 'client-123',
          first_name: 'John',
          last_name: 'Doe',
          preferred_contact_method: method,
        };

        const normalized = normalizeFirebaseClient(firebaseDoc);
        expect(normalized.preferred_contact_method).toBe(method);
      });
    });

    it('should generate timestamps if missing', () => {
      const firebaseDoc: FirebaseClient = {
        $id: 'client-123',
        first_name: 'John',
        last_name: 'Doe',
      };

      const normalized = normalizeFirebaseClient(firebaseDoc);

      expect(normalized.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(normalized.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
