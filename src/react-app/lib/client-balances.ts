import { databases, DATABASE_ID, COLLECTIONS, Query } from './backend';
import type { Client } from '@/shared/types';

// Database document interfaces
interface MatterDoc {
  $id?: string;
  id?: string;
  client_id?: string;
  clients?: { id?: string; $id?: string };
  title: string;
  matter_number?: string;
  $createdAt?: string;
}

interface InvoiceDoc {
  $id?: string;
  id?: string;
  matter_id?: string;
  matters?: { id?: string; $id?: string };
  invoice_number: string;
  total?: number;
  amount?: number;
  status: string;
  issue_date?: string;
  due_date?: string;
  $createdAt?: string;
}

interface PaymentDoc {
  $id?: string;
  id?: string;
  invoice_id?: string;
  invoices?: { id?: string; $id?: string };
  amount: number;
  payment_method: string;
  reference?: string;
  received_at?: string;
  $createdAt?: string;
}

interface TimeEntryDoc {
  $id?: string;
  id?: string;
  matter_id?: string;
  matters?: { id?: string; $id?: string };
  hours: number;
  rate: number;
  $createdAt?: string;
}

export interface ClientBalance {
  id: string;
  client_id: string;
  client_number?: string;
  first_name: string;
  last_name: string;
  email?: string;
  balance: number;
  current_balance: number;
  total_paid: number;
  total_invoiced: number;
  unbilled_amount: number;
  total_amount_due: number;
  last_payment_date?: string;
  outstanding_invoices: number;
  matter_balances?: Array<{
    matter_id: string;
    matter_number: string;
    matter_title: string;
    balance: number;
  }>;
  recent_invoices?: Array<{
    id: string;
    invoice_number: string;
    status: string;
    matter_title: string;
    issue_date: string;
    due_date: string;
    total: number;
  }>;
  recent_payments?: Array<{
    id: string;
    invoice_number: string;
    matter_title: string;
    received_at: string;
    payment_method: string;
    reference?: string;
    amount: number;
  }>;
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function toStringOrUndefined(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return undefined;
}

function nestedId(value: unknown): string | undefined {
  const record = toRecord(value);
  const raw = record.id ?? record.$id;
  return toStringOrUndefined(raw);
}

/**
 * Calculate client balances using Firestore queries via the backend adapter
 */
export async function fetchClientBalances(): Promise<ClientBalance[]> {
  try {
    // Fetch all clients
    const clientsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.clients,
      [Query.limit(500)] // Adjust limit as needed
    );

    // Normalize client documents to ensure they have required fields
    const clients = (clientsResponse.documents || []).map((doc: any) => ({
      ...doc,
      id: doc.id || doc.$id,
      first_name: doc.first_name || '',
      last_name: doc.last_name || '',
      email: doc.email || undefined,
      client_number: doc.client_number || undefined,
    })) as Client[];

    // Fetch all invoices, payments, time entries, and matters for balance calculations
    const [invoicesResponse, paymentsResponse, timeEntriesResponse, mattersResponse] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.invoices, [Query.limit(5000)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.payments, [Query.limit(5000)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.timeEntries, [Query.limit(5000)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.matters, [Query.limit(1000)])
    ]);

    const invoices: InvoiceDoc[] = (invoicesResponse.documents || []).map((raw) => {
      const record = toRecord(raw);
      const nested = toRecord(record.matters as unknown);
      return {
        $id: toStringOrUndefined(record.$id),
        id: toStringOrUndefined(record.id),
        matter_id: toStringOrUndefined(record.matter_id) ?? nestedId(nested),
        matters: nested,
        invoice_number: String(record.invoice_number ?? ''),
        total: typeof record.total === 'number' ? record.total : undefined,
        amount: typeof record.amount === 'number' ? record.amount : undefined,
        status: String(record.status ?? ''),
        issue_date: record.issue_date as string | undefined,
        due_date: record.due_date as string | undefined,
        $createdAt: record.$createdAt as string | undefined,
      } satisfies InvoiceDoc;
    });

    const payments: PaymentDoc[] = (paymentsResponse.documents || []).map((raw) => {
      const record = toRecord(raw);
      const nested = toRecord(record.invoices as unknown);
      return {
        $id: toStringOrUndefined(record.$id),
        id: toStringOrUndefined(record.id),
        invoice_id: toStringOrUndefined(record.invoice_id) ?? nestedId(nested),
        invoices: nested,
        amount: Number(record.amount ?? 0),
        payment_method: String(record.payment_method ?? ''),
        reference: record.reference as string | undefined,
        received_at: record.received_at as string | undefined,
        $createdAt: record.$createdAt as string | undefined,
      } satisfies PaymentDoc;
    });

    const timeEntries: TimeEntryDoc[] = (timeEntriesResponse.documents || []).map((raw) => {
      const record = toRecord(raw);
      const nested = toRecord(record.matters as unknown);
      return {
        $id: toStringOrUndefined(record.$id),
        id: toStringOrUndefined(record.id),
        matter_id: toStringOrUndefined(record.matter_id) ?? nestedId(nested),
        matters: nested,
        hours: Number(record.hours ?? 0),
        rate: Number(record.rate ?? 0),
        $createdAt: record.$createdAt as string | undefined,
      } satisfies TimeEntryDoc;
    });

    const matters: MatterDoc[] = (mattersResponse.documents || []).map((raw) => {
      const record = toRecord(raw);
      const nested = toRecord(record.clients as unknown);
      return {
        $id: toStringOrUndefined(record.$id),
        id: toStringOrUndefined(record.id),
        client_id: toStringOrUndefined(record.client_id) ?? nestedId(nested),
        clients: nested,
        title: String(record.title ?? ''),
        matter_number: toStringOrUndefined(record.matter_number),
        $createdAt: record.$createdAt as string | undefined,
      } satisfies MatterDoc;
    });

    // Create lookup maps for efficiency
    const invoicesByMatter = new Map<string, InvoiceDoc[]>();
    const paymentsByInvoice = new Map<string, PaymentDoc[]>();
    const timeEntriesByMatter = new Map<string, TimeEntryDoc[]>();
    const mattersByClient = new Map<string, MatterDoc[]>();

    // Group matters by client - handle both string and numeric IDs
    matters.forEach((matter: MatterDoc) => {
      const clientId = matter.client_id || matter.clients?.id || matter.clients?.$id;
      if (clientId) {
        const clientIdStr = String(clientId);
        if (!mattersByClient.has(clientIdStr)) {
          mattersByClient.set(clientIdStr, []);
        }
        mattersByClient.get(clientIdStr)?.push(matter);
        
        // Also store by numeric ID if it's a numeric string
        // This helps match clients that have numeric IDs with matters that store them as strings
        if (/^\d+$/.test(clientIdStr)) {
          const numericId = clientIdStr;
          if (!mattersByClient.has(numericId)) {
            mattersByClient.set(numericId, []);
          }
          const existingMatters = mattersByClient.get(numericId) || [];
          if (!existingMatters.includes(matter)) {
            existingMatters.push(matter);
          }
        }
      }
    });

    // Group invoices by matter
    invoices.forEach((invoice: InvoiceDoc) => {
      const matterId = invoice.matter_id || invoice.matters?.id || invoice.matters?.$id;
      if (matterId && !invoicesByMatter.has(matterId)) {
        invoicesByMatter.set(matterId, []);
      }
      if (matterId) {
        invoicesByMatter.get(matterId)?.push(invoice);
      }
    });

    // Group payments by invoice
    payments.forEach((payment: PaymentDoc) => {
      const invoiceId = payment.invoice_id || payment.invoices?.id || payment.invoices?.$id;
      if (invoiceId && !paymentsByInvoice.has(invoiceId)) {
        paymentsByInvoice.set(invoiceId, []);
      }
      if (invoiceId) {
        paymentsByInvoice.get(invoiceId)?.push(payment);
      }
    });

    // Group time entries by matter
    timeEntries.forEach((entry: TimeEntryDoc) => {
      const matterId = entry.matter_id || entry.matters?.id || entry.matters?.$id;
      if (matterId && !timeEntriesByMatter.has(matterId)) {
        timeEntriesByMatter.set(matterId, []);
      }
      if (matterId) {
        timeEntriesByMatter.get(matterId)?.push(entry);
      }
    });

    // Calculate balances for each client
    const clientBalances: ClientBalance[] = clients.map((client: Client) => {
      // Support records that may contain either numeric id or $id
      const clientId = String(client.id || (client as any).$id);
      
      // Try multiple ID formats to find matters
      let clientMatters = mattersByClient.get(clientId) || [];
      
      // If no matters found, try with $id
      if (clientMatters.length === 0 && (client as any).$id) {
        clientMatters = mattersByClient.get(String((client as any).$id)) || [];
      }
      
      // If still no matters, try without converting to string (for numeric IDs)
      if (clientMatters.length === 0 && client.id) {
        clientMatters = mattersByClient.get(client.id as any) || [];
      }
      
      let totalInvoiced = 0;
      let totalPaid = 0;
      let unbilledAmount = 0;
      let outstandingInvoices = 0;
      let lastPaymentDate: string | undefined = undefined;
      const matterBalances: Array<{
        matter_id: string;
        matter_number: string;
        matter_title: string;
        balance: number;
      }> = [];
      const recentInvoices: Array<{
        id: string;
        invoice_number: string;
        status: string;
        matter_title: string;
        issue_date: string;
        due_date: string;
        total: number;
      }> = [];
      const recentPayments: Array<{
        id: string;
        invoice_number: string;
        matter_title: string;
        received_at: string;
        payment_method: string;
        reference?: string;
        amount: number;
      }> = [];

      clientMatters.forEach((matter: MatterDoc) => {
        const matterId = matter.id || matter.$id;
        if (!matterId) return;
        
        const matterInvoices = invoicesByMatter.get(matterId) || [];
        const matterTimeEntries = timeEntriesByMatter.get(matterId) || [];
        
        let matterInvoicedTotal = 0;
        let matterPaidTotal = 0;
        
        // Calculate invoiced amount and payments for this matter
        matterInvoices.forEach((invoice: InvoiceDoc) => {
          const invoiceTotal = Number(invoice.total || invoice.amount || 0);
          
          // Only include non-draft invoices in the totals
          // Draft invoices haven't been sent to the client yet
          if (invoice.status !== 'Draft') {
            matterInvoicedTotal += invoiceTotal;
            totalInvoiced += invoiceTotal;
            
            if (invoice.status !== 'Paid') {
              outstandingInvoices++;
            }
          }
          
          const invoiceId = invoice.id || invoice.$id;
          if (!invoiceId) return;
          
          const invoicePayments = paymentsByInvoice.get(invoiceId) || [];
          
          invoicePayments.forEach((payment: PaymentDoc) => {
            const paymentAmount = Number(payment.amount || 0);
            matterPaidTotal += paymentAmount;
            totalPaid += paymentAmount;
            
            // Track last payment date
            const paymentDate = payment.received_at || payment.$createdAt;
            if (!lastPaymentDate || (paymentDate && paymentDate > lastPaymentDate)) {
              lastPaymentDate = paymentDate;
            }
            
            // Add to recent payments
            recentPayments.push({
              id: payment.id || payment.$id || '',
              invoice_number: invoice.invoice_number,
              matter_title: matter.title,
              received_at: paymentDate || '',
              payment_method: payment.payment_method,
              reference: payment.reference,
              amount: paymentAmount,
            });
          });
          
          // Add to recent invoices (including drafts for visibility)
          recentInvoices.push({
            id: invoice.id || invoice.$id || '',
            invoice_number: invoice.invoice_number,
            status: invoice.status,
            matter_title: matter.title,
            issue_date: invoice.issue_date || invoice.$createdAt || '',
            due_date: invoice.due_date || '',
            total: invoiceTotal,
          });
        });
        
        // Calculate unbilled time for this matter
        let matterUnbilled = 0;
        matterTimeEntries.forEach((entry: TimeEntryDoc) => {
          const hours = Number(entry.hours || 0);
          const rate = Number(entry.rate || 0);
          matterUnbilled += hours * rate;
        });
        
        unbilledAmount += matterUnbilled;
        
        // Add matter balance
        matterBalances.push({
          matter_id: matterId,
          matter_number: matter.matter_number || '',
          matter_title: matter.title,
          balance: matterInvoicedTotal - matterPaidTotal + matterUnbilled,
        });
      });

      const currentBalance = totalInvoiced - totalPaid;
      const totalAmountDue = currentBalance + unbilledAmount;

      // Sort recent items by date (most recent first)
      recentInvoices.sort((a, b) => new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime());
      recentPayments.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());

      return {
        id: clientId,
        client_id: clientId,
        client_number: client.client_number ?? undefined,
        first_name: client.first_name || '',
        last_name: client.last_name || '',
        email: client.email ?? undefined,
        balance: currentBalance,
        current_balance: currentBalance,
        total_paid: totalPaid,
        total_invoiced: totalInvoiced,
        unbilled_amount: unbilledAmount,
        total_amount_due: totalAmountDue,
        last_payment_date: lastPaymentDate,
        outstanding_invoices: outstandingInvoices,
        matter_balances: matterBalances.slice(0, 10), // Limit for performance
        recent_invoices: recentInvoices.slice(0, 5),   // Last 5 invoices
        recent_payments: recentPayments.slice(0, 5),   // Last 5 payments
      };
    });

    return clientBalances;
  } catch (error) {
    console.error('Error fetching client balances:', error);
    throw error;
  }
}

/**
 * Get balance details for a specific client
 */
export async function fetchClientBalance(clientId: string): Promise<ClientBalance | null> {
  try {
    const balances = await fetchClientBalances();
    // Check both client_id and id fields for matching
    return balances.find(balance => 
      balance.client_id === clientId || 
      balance.id === clientId
    ) || null;
  } catch (error) {
    console.error('Error fetching client balance:', error);
    return null;
  }
}
