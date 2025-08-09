import { Context } from 'hono';
import { Env } from './types';

// Client Portal Lookup - Find client by email, phone, or name
export async function handleClientPortalLookup(c: Context<{ Bindings: Env }>) {
  try {
    const method = c.req.query('method'); // 'email', 'phone', 'name'
    const value = c.req.query('value');
    const lastName = c.req.query('lastName');

    if (!method || !value) {
      return c.json({ error: 'Missing search parameters' }, 400);
    }

    let client;

    if (method === 'email') {
      const stmt = c.env.DB.prepare('SELECT * FROM clients WHERE email = ? LIMIT 1');
      client = await stmt.bind(value).first();
    } else if (method === 'phone') {
      // Search by phone number (try both mobile_phone and home_phone)
      const stmt = c.env.DB.prepare(`
        SELECT * FROM clients 
        WHERE mobile_phone = ? OR home_phone = ? OR phone = ?
        LIMIT 1
      `);
      client = await stmt.bind(value, value, value).first();
    } else if (method === 'name') {
      if (!lastName) {
        return c.json({ error: 'Last name is required when searching by name' }, 400);
      }
      const stmt = c.env.DB.prepare(`
        SELECT * FROM clients 
        WHERE first_name = ? AND last_name = ?
        LIMIT 1
      `);
      client = await stmt.bind(value, lastName).first();
    } else {
      return c.json({ error: 'Invalid search method' }, 400);
    }

    if (!client) {
      return c.json({ error: 'Client not found' }, 404);
    }

    // Return basic client info (don't expose sensitive data)
    return c.json({
      id: client.id,
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email
    });

  } catch (error) {
    console.error('Error in client portal lookup:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}

// Client Portal Data - Get all client portal data for a specific client
export async function handleClientPortalData(c: Context<{ Bindings: Env }>) {
  try {
    const clientId = c.req.param('clientId');

    if (!clientId) {
      return c.json({ error: 'Client ID is required' }, 400);
    }

    // Get client information
    const clientStmt = c.env.DB.prepare('SELECT * FROM clients WHERE id = ?');
    const client = await clientStmt.bind(clientId).first();

    if (!client) {
      return c.json({ error: 'Client not found' }, 404);
    }

    // Get client's matters
    const mattersStmt = c.env.DB.prepare(`
      SELECT * FROM matters WHERE client_id = ? 
      ORDER BY created_at DESC
    `);
    const matters = await mattersStmt.bind(clientId).all();

    // Get client's documents
    const documentsStmt = c.env.DB.prepare(`
      SELECT d.* FROM documents d
      JOIN matters m ON d.matter_id = m.id
      WHERE m.client_id = ?
      ORDER BY d.created_at DESC
      LIMIT 50
    `);
    const documents = await documentsStmt.bind(clientId).all();

    // Get client's messages/communications
    const messagesStmt = c.env.DB.prepare(`
      SELECT c.* FROM communications c
      JOIN matters m ON c.matter_id = m.id
      WHERE m.client_id = ?
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    const messages = await messagesStmt.bind(clientId).all();

    // Get client's invoices
    const invoicesStmt = c.env.DB.prepare(`
      SELECT i.* FROM invoices i
      JOIN matters m ON i.matter_id = m.id
      WHERE m.client_id = ?
      ORDER BY i.created_at DESC
    `);
    const invoices = await invoicesStmt.bind(clientId).all();

    // Get upcoming hearings
    const hearingsStmt = c.env.DB.prepare(`
      SELECT h.*, m.title as matter_title FROM hearings h
      JOIN matters m ON h.matter_id = m.id
      WHERE m.client_id = ? AND h.start_at > datetime('now')
      ORDER BY h.start_at ASC
      LIMIT 10
    `);
    const upcomingHearings = await hearingsStmt.bind(clientId).all();

    return c.json({
      client,
      matters: matters.results || [],
      documents: documents.results || [],
      messages: messages.results || [],
      invoices: invoices.results || [],
      upcomingHearings: upcomingHearings.results || []
    });

  } catch (error) {
    console.error('Error fetching client portal data:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
}
