import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Download, Send, Calendar, User, FileText } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

interface Invoice {
  id: number;
  matter_id: number;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  line_items: any[];
  subtotal: number;
  taxes: number;
  discounts: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  matter_title?: string;
  client_name?: string;
  created_at: string;
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const data = await databases.getDocument(DATABASE_ID, COLLECTIONS.invoices, String(id));
      const normalized = {
        ...(data as any),
        id: (data as any).id ?? (data as any).$id,
        line_items: (() => {
          try { return JSON.parse((data as any).line_items || '[]'); } catch { return []; }
        })(),
      } as unknown as Invoice;
      setInvoice(normalized);
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvoice = async () => {
    if (!invoice) return;
    
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.invoices, String(invoice.id), { status: 'Sent' });
      setInvoice({ ...invoice, status: 'Sent' });
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
  };

  const downloadInvoice = () => {
    // In a real implementation, this would generate and download a PDF
    alert('Download functionality would be implemented here');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-blue-100 text-blue-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/billing" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Invoice not found</p>
        <Link to="/billing" className="text-blue-600 hover:text-blue-700">
          Back to billing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/billing" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoice_number}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              <span className="text-sm text-gray-500">
                Total: ${invoice.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadInvoice}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </button>
          {invoice.status === 'Draft' && (
            <button
              onClick={sendInvoice}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </button>
          )}
        </div>
      </div>

      {/* Invoice Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Invoice #:</span>
                <span className="text-sm font-medium text-gray-900 ml-2">{invoice.invoice_number}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Issue Date:</span>
                <span className="text-sm font-medium text-gray-900 ml-2">
                  {new Date(invoice.issue_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Due Date:</span>
                <span className="text-sm font-medium text-gray-900 ml-2">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Matter & Client</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <FileText className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Matter:</span>
                <Link 
                  to={`/matters/${invoice.matter_id}`}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 ml-2"
                >
                  {invoice.matter_title}
                </Link>
              </div>
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">Client:</span>
                <span className="text-sm font-medium text-gray-900 ml-2">{invoice.client_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-sm font-medium text-gray-600">Description</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Quantity</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Rate</th>
                  <th className="text-right py-2 px-3 text-sm font-medium text-gray-600">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.line_items.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-3 text-sm text-gray-900">{item.description}</td>
                    <td className="py-3 px-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                    <td className="py-3 px-3 text-sm text-gray-900 text-right">${item.rate.toFixed(2)}</td>
                    <td className="py-3 px-3 text-sm text-gray-900 text-right font-medium">${item.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 pt-6">
          <div className="max-w-sm ml-auto space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="text-gray-900">${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.taxes > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Taxes:</span>
                <span className="text-gray-900">${invoice.taxes.toFixed(2)}</span>
              </div>
            )}
            {invoice.discounts > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="text-gray-900">-${invoice.discounts.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">${invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
