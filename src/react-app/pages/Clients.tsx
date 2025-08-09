import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Search, Phone, Mail, Filter, Download, DollarSign, AlertCircle, Eye } from 'lucide-react';
import type { Client } from '@/shared/types';
import ClientActionsMenu from '../components/ClientActionsMenu';
import ClientFilterModal, { type ClientFilters } from '../components/ClientFilterModal';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientBalances, setClientBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showBalances, setShowBalances] = useState(false);
  const [filters, setFilters] = useState<ClientFilters>({
    contactMethod: '',
    portalStatus: '',
    dateRange: '',
    hasEmail: null,
    hasPhone: null,
  });

  useEffect(() => {
    void fetchClients();
    if (showBalances) {
      void fetchClientBalances();
    }
  }, [showBalances]);

  const fetchClients = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.clients, []);
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      })) as unknown as Client[];
      setClients(rows);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientBalances = async () => {
    try {
      console.log('Fetching client balances...');
      const response = await fetch('/api/clients/balances', {
        credentials: 'include',
      });
      console.log('Balance response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Client balances data:', data);
        setClientBalances(data);
      } else {
        console.error('Failed to fetch client balances:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching client balances:', error);
    }
  };

  const exportClients = () => {
    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Preferred Contact', 'Portal Status', 'Created Date'];
    const csvContent = [
      headers.join(','),
      ...filteredClients.map(client => [
        `"${client.first_name} ${client.last_name}"`,
        `"${client.email || ''}"`,
        `"${client.phones ? JSON.parse(client.phones)[0] || '' : ''}"`,
        `"${client.preferred_contact_method || ''}"`,
        `"${client.portal_enabled ? 'Enabled' : 'Disabled'}"`,
        `"${new Date(client.created_at).toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleApplyFilters = (newFilters: ClientFilters) => {
    setFilters(newFilters);
  };

  const filteredClients = useMemo(() => clients.filter(client => {
    // Search filter
    const matchesSearch = `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Contact method filter
    const matchesContactMethod = !filters.contactMethod || 
                                client.preferred_contact_method === filters.contactMethod;
    
    // Portal status filter
    const matchesPortalStatus = !filters.portalStatus || 
                               (filters.portalStatus === 'enabled' && client.portal_enabled) ||
                               (filters.portalStatus === 'disabled' && !client.portal_enabled);
    
    // Date range filter
    let matchesDateRange = true;
    if (filters.dateRange) {
      const clientDate = new Date(client.created_at);
      const now = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          matchesDateRange = clientDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDateRange = clientDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          matchesDateRange = clientDate >= monthAgo;
          break;
        case 'quarter':
          const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          matchesDateRange = clientDate >= quarterAgo;
          break;
      }
    }
    
    // Contact info filters
    const matchesEmail = filters.hasEmail === null || 
                        (filters.hasEmail && client.email) ||
                        (!filters.hasEmail && !client.email);
    
    const matchesPhone = filters.hasPhone === null || 
                        (filters.hasPhone && client.phones) ||
                        (!filters.hasPhone && !client.phones);
    
    return matchesSearch && matchesContactMethod && matchesPortalStatus && 
           matchesDateRange && matchesEmail && matchesPhone;
  }), [clients, filters, searchTerm]);

  const filteredClientBalances = clientBalances.filter(client => {
    return `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
           client.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Clients</h1>
        </div>
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/20 rounded"></div>
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
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="text-blue-200">Manage your client database</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/intake/new"
            className="inline-flex items-center px-4 py-2 border border-green-400/30 text-sm font-medium rounded-lg text-green-200 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Intake
          </Link>
          <Link
            to="/clients/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
              <input
                type="text"
                placeholder="Search clients by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
              />
            </div>
          </div>
          <button 
            onClick={() => setShowFilterModal(true)}
            className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </button>
          <button 
            onClick={() => setShowBalances(!showBalances)}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg transition-colors backdrop-blur-sm ${
              showBalances 
                ? 'border-blue-400/40 text-blue-200 bg-blue-500/20 hover:bg-blue-500/30' 
                : 'border-white/20 text-blue-100 bg-white/10 hover:bg-white/20'
            }`}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            {showBalances ? 'Hide Balances' : 'Show Balances'}
          </button>
          <button 
            onClick={exportClients}
            className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards for Balances View */}
      {showBalances && clientBalances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-blue-300 mr-2" />
              <div>
                <p className="text-xs font-medium text-blue-200">Total Outstanding</p>
                <p className="text-lg font-bold text-white">
                  ${clientBalances.reduce((sum, client) => sum + (client.current_balance || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-300 mr-2" />
              <div>
                <p className="text-xs font-medium text-green-200">Total Paid</p>
                <p className="text-lg font-bold text-white">
                  ${clientBalances.reduce((sum, client) => sum + (client.total_paid || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-4 border border-purple-400/30">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-purple-300 mr-2" />
              <div>
                <p className="text-xs font-medium text-purple-200">Clients with Balance</p>
                <p className="text-lg font-bold text-white">
                  {clientBalances.filter(client => (client.current_balance || 0) > 0).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-orange-300 mr-2" />
              <div>
                <p className="text-xs font-medium text-orange-200">Unbilled Amount</p>
                <p className="text-lg font-bold text-white">
                  ${clientBalances.reduce((sum, client) => sum + (client.unbilled_amount || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                  Contact
                </th>
                {!showBalances && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      Preferred Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      Portal Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      Created
                    </th>
                  </>
                )}
                {showBalances && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      Total Invoiced
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      Total Paid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      Balance Due
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                      Unbilled
                    </th>
                  </>
                )}
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/5 divide-y divide-white/10">
              {(showBalances ? filteredClientBalances : filteredClients).length === 0 ? (
                <tr>
                  <td colSpan={showBalances ? 7 : 6} className="px-6 py-12 text-center">
                    <div className="text-blue-200">
                      {searchTerm ? 'No clients found matching your search.' : 'No clients yet.'}
                    </div>
                    {!searchTerm && (
                      <Link
                        to="/clients/new"
                        className="mt-2 inline-flex items-center text-sm text-blue-300 hover:text-blue-100"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add your first client
                      </Link>
                    )}
                  </td>
                </tr>
              ) : showBalances ? (
                filteredClientBalances.map((client) => (
                  <tr key={client.id} className="hover:bg-white/10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-sm text-blue-200">
                            Client #{client.client_number || client.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center text-sm text-white">
                            <Mail className="mr-2 h-3 w-3 text-blue-300" />
                            {client.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        ${client.total_invoiced?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        ${client.total_paid?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        (client.current_balance || 0) > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        ${client.current_balance?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-orange-600">
                        ${client.unbilled_amount?.toLocaleString() || '0'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/clients/${client.id}?tab=billing`}
                          className="text-blue-300 hover:text-blue-100"
                          title="View Client Billing"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <ClientActionsMenu client={client} onUpdate={fetchClients} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-white/10">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {client.first_name.charAt(0)}{client.last_name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {client.first_name} {client.last_name}
                          </div>
                          <div className="text-sm text-blue-200">
                            Client #{client.client_number || client.id}
                            {client.ssn_last4 && ` • SSN: ***-**-${client.ssn_last4}`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {client.email && (
                          <div className="flex items-center text-sm text-white">
                            <Mail className="mr-2 h-3 w-3 text-blue-300" />
                            {client.email}
                          </div>
                        )}
                        {client.phones && (
                          <div className="flex items-center text-sm text-blue-200">
                            <Phone className="mr-2 h-3 w-3 text-blue-300" />
                            {JSON.parse(client.phones)[0]}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.preferred_contact_method && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {client.preferred_contact_method}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.portal_enabled 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.portal_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <ClientActionsMenu client={client} onUpdate={fetchClients} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filter Modal */}
      <ClientFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
}
