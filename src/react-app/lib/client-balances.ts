import { databases, DATABASE_ID, COLLECTIONS, Query } from './appwrite';
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

/**
 * Calculate client balances using Appwrite database queries
 */
export async function fetchClientBalances(): Promise<ClientBalance[]> {
  try {
    // Fetch all clients
    const clientsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.clients,
      [Query.limit(500)] // Adjust limit as needed
    );

    const clients = clientsResponse.documents as unknown as Client[];

    // Fetch all invoices, payments, time entries, and matters for balance calculations
    const [invoicesResponse, paymentsResponse, timeEntriesResponse, mattersResponse] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.invoices, [Query.limit(5000)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.payments, [Query.limit(5000)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.timeEntries, [Query.limit(5000)]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.matters, [Query.limit(1000)])
    ]);

    const invoices: InvoiceDoc[] = (invoicesResponse.documents as unknown[] || []).map((d) => ({
      $id: (d as any).$id,
      id: (d as any).id,
      matter_id: (d as any).matter_id || (d as any).matters?.id || (d as any).matters?.$id,
      matters: (d as any).matters,
      invoice_number: String((d as any).invoice_number || ''),
      total: (typeof (d as any).total === 'number' ? (d as any).total : undefined),
      amount: (typeof (d as any).amount === 'number' ? (d as any).amount : undefined),
      status: String((d as any).status || ''),
      issue_date: (d as any).issue_date,
      due_date: (d as any).due_date,
      $createdAt: (d as any).$createdAt,
    }));
    const payments: PaymentDoc[] = (paymentsResponse.documents as unknown[] || []).map((d) => ({
      $id: (d as any).$id,
      id: (d as any).id,
      invoice_id: (d as any).invoice_id || (d as any).invoices?.id || (d as any).invoices?.$id,
      invoices: (d as any).invoices,
      amount: Number((d as any).amount || 0),
      payment_method: String((d as any).payment_method || ''),
      reference: (d as any).reference,
      received_at: (d as any).received_at,
      $createdAt: (d as any).$createdAt,
    }));
    const timeEntries: TimeEntryDoc[] = (timeEntriesResponse.documents as unknown[] || []).map((d) => ({
      $id: (d as any).$id,
      id: (d as any).id,
      matter_id: (d as any).matter_id || (d as any).matters?.id || (d as any).matters?.$id,
      matters: (d as any).matters,
      hours: Number((d as any).hours || 0),
      rate: Number((d as any).rate || 0),
      $createdAt: (d as any).$createdAt,
    }));
    const matters: MatterDoc[] = (mattersResponse.documents as unknown[] || []).map((d) => ({
      $id: (d as any).$id,
      id: (d as any).id,
      client_id: (d as any).client_id || (d as any).clients?.id || (d as any).clients?.$id,
      clients: (d as any).clients,
      title: String((d as any).title || ''),
      matter_number: (d as any).matter_number,
      $createdAt: (d as any).$createdAt,
    }));

    // Create lookup maps for efficiency
    const invoicesByMatter = new Map<string, InvoiceDoc[]>();
    const paymentsByInvoice = new Map<string, PaymentDoc[]>();
    const timeEntriesByMatter = new Map<string, TimeEntryDoc[]>();
    const mattersByClient = new Map<string, MatterDoc[]>();

    // Group matters by client
    matters.forEach((matter: MatterDoc) => {
      const clientId = matter.client_id || matter.clients?.id || matter.clients?.$id;
      if (clientId && !mattersByClient.has(clientId)) {
        mattersByClient.set(clientId, []);
      }
      if (clientId) {
        mattersByClient.get(clientId)?.push(matter);
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
      const clientId = String((client as any).id ?? (client as any).$id ?? '');
      const clientMatters = mattersByClient.get(clientId) || [];
      
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
          matterInvoicedTotal += invoiceTotal;
          totalInvoiced += invoiceTotal;
          
          if (invoice.status !== 'Paid') {
            outstandingInvoices++;
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
          
          // Add to recent invoices
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
        client_number: (client as any).client_number ?? undefined,
        first_name: client.first_name,
        last_name: client.last_name,
        email: (client as any).email ?? undefined,
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
    return balances.find(balance => balance.client_id === clientId) || null;
  } catch (error) {
    console.error('Error fetching client balance:', error);
    return null;
  }
}
