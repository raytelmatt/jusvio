import { databases, DATABASE_ID, COLLECTIONS } from './backend';
import type { Client } from '@/shared/types';

/**
 * Firebase Client Utilities
 * Handles all client operations with proper Firebase/Firestore integration
 */

export interface FirebaseClient {
  $id: string;
  $createdAt?: string;
  $updatedAt?: string;
  [key: string]: unknown;
}

/**
 * Normalize Firebase document to Client type
 */
export function normalizeFirebaseClient(doc: FirebaseClient): Client {
  return {
    $id: doc.$id,
    id: doc.$id, // Use Firestore document ID as the primary ID
    $createdAt: doc.$createdAt,
    $updatedAt: doc.$updatedAt,
    client_number: typeof doc.client_number === 'string' ? doc.client_number : null,
    first_name: String(doc.first_name || ''),
    last_name: String(doc.last_name || ''),
    date_of_birth: typeof doc.date_of_birth === 'string' ? doc.date_of_birth : null,
    ssn_last4: typeof doc.ssn_last4 === 'string' ? doc.ssn_last4 : null,
    phones: typeof doc.phones === 'string' ? doc.phones : null,
    email: typeof doc.email === 'string' ? doc.email : null,
    address: typeof doc.address === 'string' ? doc.address : null,
    emergency_contact: typeof doc.emergency_contact === 'string' ? doc.emergency_contact : null,
    preferred_contact_method: (doc.preferred_contact_method as Client['preferred_contact_method']) ?? null,
    notifications_opt_in: Boolean(doc.notifications_opt_in),
    portal_enabled: Boolean(doc.portal_enabled),
    created_at: typeof doc.created_at === 'string' ? doc.created_at : new Date().toISOString(),
    updated_at: typeof doc.updated_at === 'string' ? doc.updated_at : new Date().toISOString(),
  };
}

/**
 * Fetch all clients from Firestore
 */
export async function fetchAllClients(): Promise<Client[]> {
  try {
    const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.clients, []);
    return (response.documents || []).map(normalizeFirebaseClient);
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw new Error('Failed to fetch clients');
  }
}

/**
 * Fetch a single client by ID
 */
export async function fetchClientById(clientId: string): Promise<Client> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.clients, clientId);
    return normalizeFirebaseClient(doc as FirebaseClient);
  } catch (error) {
    console.error('Error fetching client:', error);
    throw new Error('Client not found');
  }
}

/**
 * Create a new client
 */
export async function createClient(clientData: Omit<Client, 'id' | '$id' | 'created_at' | 'updated_at'>): Promise<Client> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...clientData,
      created_at: now,
      updated_at: now,
    };

    const created = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.clients,
      'unique()',
      payload
    );

    return normalizeFirebaseClient(created as FirebaseClient);
  } catch (error) {
    console.error('Error creating client:', error);
    throw new Error('Failed to create client');
  }
}

/**
 * Update an existing client
 */
export async function updateClient(clientId: string, updates: Partial<Client>): Promise<Client> {
  try {
    const now = new Date().toISOString();
    const payload = {
      ...updates,
      updated_at: now,
    };

    const updated = await databases.updateDocument(
      DATABASE_ID,
      COLLECTIONS.clients,
      clientId,
      payload
    );

    return normalizeFirebaseClient(updated as FirebaseClient);
  } catch (error) {
    console.error('Error updating client:', error);
    throw new Error('Failed to update client');
  }
}

/**
 * Delete a client
 */
export async function deleteClient(clientId: string): Promise<void> {
  try {
    await databases.deleteDocument(DATABASE_ID, COLLECTIONS.clients, clientId);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw new Error('Failed to delete client');
  }
}

/**
 * Search clients by name or email
 */
export async function searchClients(searchTerm: string): Promise<Client[]> {
  try {
    // For now, fetch all and filter client-side
    // TODO: Implement server-side search when Firebase supports it
    const allClients = await fetchAllClients();
    const term = searchTerm.toLowerCase();
    
    return allClients.filter(client => 
      client.first_name.toLowerCase().includes(term) ||
      client.last_name.toLowerCase().includes(term) ||
      (client.email && client.email.toLowerCase().includes(term))
    );
  } catch (error) {
    console.error('Error searching clients:', error);
    throw new Error('Failed to search clients');
  }
}
