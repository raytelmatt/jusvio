import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Plus, 
  Search, 
  Clock, 
  FileText, 
  CreditCard,
  Download,
  Eye,
  Send,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Users
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

interface TimeEntry {
  id: number;
  matter_id: number;
  user_id: string;
  entry_date: string;
  hours: number;
  rate: number;
  description: string;
  matter_title?: string;
  client_name?: string;
  created_at: string;
}

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

interface Payment {
  id: number;
  invoice_id: number;
  payment_method: 'Card' | 'ACH' | 'Cash' | 'Check';
  amount: number;
  received_at: string;
  reference?: string;
  invoice_number?: string;
  client_name?: string;
}

export default function Billing() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('time');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const [timeList, invoiceList] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.timeEntries, []),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.invoices, []),
      ]);
      setTimeEntries((timeList.documents || []) as unknown as TimeEntry[]);
      setInvoices((invoiceList.documents || []) as unknown as Invoice[]);
      setPayments([]);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendInvoice = async (invoiceId: number) => {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.invoices, String(invoiceId), { status: 'Sent' });
      setInvoices(invoices.map(inv => 
        inv.id === invoiceId ? { ...inv, status: 'Sent' as const } : inv
      ));
    } catch (error) {
      console.error('Error sending invoice:', error);
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="w-4 h-4" />;
      case 'Overdue': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const filteredTimeEntries = timeEntries.filter(entry => {
    const matchesSearch = entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.matter_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.matter_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate summary stats
  const totalUnbilledTime = timeEntries.reduce((sum, entry) => sum + (entry.hours * entry.rate), 0);
  const totalOutstanding = invoices
    .filter(inv => inv.status === 'Sent' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + inv.total, 0);
  const totalPaidThisMonth = payments
    .filter(payment => new Date(payment.received_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
    .reduce((sum, payment) => sum + payment.amount, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        </div>
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="text-blue-200">Manage time tracking, invoices, and payments</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/billing/time/new"
            className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Clock className="mr-2 h-4 w-4" />
            Log Time
          </Link>
          <Link
            to="/clients/balances"
            className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Users className="mr-2 h-4 w-4" />
            Client Balances
          </Link>
          <Link
            to="/billing/invoice/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-200">Unbilled Time</p>
              <p className="text-2xl font-bold text-white">${totalUnbilledTime.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-yellow-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-200">Outstanding</p>
              <p className="text-2xl font-bold text-white">${totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-green-300" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-200">Paid This Month</p>
              <p className="text-2xl font-bold text-white">${totalPaidThisMonth.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {activeTab === 'invoices' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
        <div className="border-b border-white/20">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('time')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'time'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-white/30'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Time Entries ({timeEntries.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'invoices'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-white/30'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Invoices ({invoices.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'payments'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-white/30'
              }`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Payments ({payments.length})</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'time' && (
            <div className="space-y-4">
              {filteredTimeEntries.length > 0 ? (
                filteredTimeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Clock className="w-5 h-5 text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">{entry.description}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {entry.matter_title && (
                            <div className="flex items-center text-xs text-blue-200">
                              <FileText className="w-3 h-3 mr-1" />
                              {entry.matter_title}
                            </div>
                          )}
                          {entry.client_name && (
                            <div className="flex items-center text-xs text-blue-200">
                              <User className="w-3 h-3 mr-1" />
                              {entry.client_name}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-blue-200">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(entry.entry_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">{entry.hours}h @ ${entry.rate}/hr</p>
                        <p className="text-lg font-bold text-white">${(entry.hours * entry.rate).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Clock className="mx-auto h-12 w-12 text-blue-400" />
                  <h3 className="mt-2 text-sm font-medium text-white">No time entries found</h3>
                  <p className="mt-1 text-sm text-blue-200">
                    Start tracking time to generate billable hours.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/billing/time/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Log Time
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        {getStatusIcon(invoice.status)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">Invoice #{invoice.invoice_number}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {invoice.matter_title && (
                            <div className="flex items-center text-xs text-blue-200">
                              <FileText className="w-3 h-3 mr-1" />
                              {invoice.matter_title}
                            </div>
                          )}
                          {invoice.client_name && (
                            <div className="flex items-center text-xs text-blue-200">
                              <User className="w-3 h-3 mr-1" />
                              {invoice.client_name}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-blue-200">
                            <Calendar className="w-3 h-3 mr-1" />
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">${invoice.total.toFixed(2)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link to={`/billing/invoice/${invoice.id}`} className="p-2 text-blue-300 hover:text-blue-100">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => alert('Download invoice functionality would be implemented here')}
                          className="p-2 text-blue-300 hover:text-blue-100"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {invoice.status === 'Draft' && (
                          <button 
                            onClick={() => sendInvoice(invoice.id)}
                            className="p-2 text-blue-300 hover:text-blue-100"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-blue-400" />
                  <h3 className="mt-2 text-sm font-medium text-white">No invoices found</h3>
                  <p className="mt-1 text-sm text-blue-200">
                    Create your first invoice to start billing clients.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/billing/invoice/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-4">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-green-300" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">
                          Payment for Invoice #{payment.invoice_number}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {payment.client_name && (
                            <div className="flex items-center text-xs text-blue-200">
                              <User className="w-3 h-3 mr-1" />
                              {payment.client_name}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-blue-200">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(payment.received_at).toLocaleDateString()}
                          </div>
                          <span className="text-xs text-blue-100 bg-white/20 px-2 py-1 rounded">
                            {payment.payment_method}
                          </span>
                          {payment.reference && (
                            <span className="text-xs text-blue-200">
                              Ref: {payment.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-300">${payment.amount.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="mx-auto h-12 w-12 text-blue-400" />
                  <h3 className="mt-2 text-sm font-medium text-white">No payments found</h3>
                  <p className="mt-1 text-sm text-blue-200">
                    Payments will appear here when invoices are paid.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
