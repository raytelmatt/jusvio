import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  AlertCircle, 
  Eye, 
  Download,
  Search,
  Users,
  FileText,
  CreditCard,
  TrendingUp
} from 'lucide-react';

interface ClientBalance {
  id: number;
  client_number: string;
  first_name: string;
  last_name: string;
  email: string;
  total_invoiced: number;
  total_paid: number;
  current_balance: number;
  unbilled_amount: number;
  total_amount_due: number;
}

export default function ClientBalances() {
  const [clientBalances, setClientBalances] = useState<ClientBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClientBalances();
  }, []);

  const fetchClientBalances = async () => {
    try {
      const response = await fetch('/api/clients/balances', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setClientBalances(data);
      }
    } catch (error) {
      console.error('Error fetching client balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportBalances = () => {
    const headers = ['Client Name', 'Client Number', 'Email', 'Total Invoiced', 'Total Paid', 'Balance Due', 'Unbilled Amount', 'Total Amount Due'];
    const csvContent = [
      headers.join(','),
      ...filteredBalances.map(client => [
        `"${client.first_name} ${client.last_name}"`,
        `"${client.client_number || ''}"`,
        `"${client.email || ''}"`,
        client.total_invoiced || 0,
        client.total_paid || 0,
        client.current_balance || 0,
        client.unbilled_amount || 0,
        client.total_amount_due || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `client_balances_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredBalances = clientBalances.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary statistics
  const totalOutstanding = clientBalances.reduce((sum, client) => sum + (client.current_balance || 0), 0);
  const totalPaid = clientBalances.reduce((sum, client) => sum + (client.total_paid || 0), 0);
  const totalUnbilled = clientBalances.reduce((sum, client) => sum + (client.unbilled_amount || 0), 0);
  const totalInvoiced = clientBalances.reduce((sum, client) => sum + (client.total_invoiced || 0), 0);
  const clientsWithBalance = clientBalances.filter(client => (client.current_balance || 0) > 0).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Client Balances</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Client Balances</h1>
          <p className="text-gray-600">Track outstanding balances and payment history</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={exportBalances}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <Link
            to="/clients"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            <Users className="mr-2 h-4 w-4" />
            View All Clients
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-xs font-medium text-blue-600">Total Invoiced</p>
              <p className="text-lg font-bold text-blue-900">${totalInvoiced.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CreditCard className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-xs font-medium text-green-600">Total Paid</p>
              <p className="text-lg font-bold text-green-900">${totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-xs font-medium text-red-600">Outstanding</p>
              <p className="text-lg font-bold text-red-900">${totalOutstanding.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <p className="text-xs font-medium text-orange-600">Unbilled</p>
              <p className="text-lg font-bold text-orange-900">${totalUnbilled.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <p className="text-xs font-medium text-purple-600">Clients w/ Balance</p>
              <p className="text-lg font-bold text-purple-900">{clientsWithBalance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, or client number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Balances Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Invoiced
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Paid
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Balance Due
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unbilled
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Due
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBalances.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {searchTerm ? 'No clients found matching your search.' : 'No clients with billing activity yet.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBalances.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Client #{client.client_number || client.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-gray-900">
                        ${client.total_invoiced?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-green-600">
                        ${client.total_paid?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-medium ${
                        (client.current_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${client.current_balance?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-orange-600">
                        ${client.unbilled_amount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm font-bold ${
                        (client.total_amount_due || 0) > 0 ? 'text-red-700' : 'text-green-600'
                      }`}>
                        ${client.total_amount_due?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/clients/${client.id}?tab=billing`}
                        className="text-blue-600 hover:text-blue-700 p-2"
                        title="View Client Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outstanding Balances Alert */}
      {totalOutstanding > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-600 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Outstanding Balances Alert</h3>
              <p className="text-sm text-red-700 mt-1">
                You have ${totalOutstanding.toLocaleString()} in outstanding client balances across {clientsWithBalance} client{clientsWithBalance === 1 ? '' : 's'}.
                Consider following up on overdue invoices and implementing payment reminders.
              </p>
              {totalUnbilled > 0 && (
                <p className="text-sm text-red-700 mt-2">
                  Additionally, you have ${totalUnbilled.toLocaleString()} in unbilled time entries that could be converted to invoices.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
