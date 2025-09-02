import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Shield,
  User,
  AlertCircle,
  FolderOpen,
  Plus,
  Settings,
  Trash2,
  DollarSign,
  FileText,
  CreditCard,
  Eye
} from 'lucide-react';
import type { Client } from '@/shared/types';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';
import { Query } from 'appwrite';

interface Matter {
  id: number;
  matter_number: string;
  title: string;
  practice_area: string;
  status: string;
  created_at: string;
}

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [clientBalance, setClientBalance] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchClientDetails();
      fetchClientMatters();
      fetchClientBalance();
    }
  }, [id]);

  useEffect(() => {
    // Check if we should open billing tab based on URL params
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, []);

  const fetchClientDetails = async () => {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTIONS.clients, String(id));
      const normalized: Record<string, unknown> = {
        ...doc,
        id: doc.id ?? doc.$id,
        created_at: doc.created_at ?? doc.$createdAt,
        updated_at: doc.updated_at ?? doc.$updatedAt,
      };
      setClient(normalized as Client);
    } catch (error) {
      console.error('Error fetching client details:', error);
      setError('Client not found');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientMatters = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.matters, [
        Query.equal('client_id', String(id)),
      ]);
      const rows = (list.documents || []).map((d: Record<string, unknown>) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
      }));
      setMatters(rows as Matter[]);
    } catch (error) {
      console.error('Error fetching client matters:', error);
    }
  };

  const fetchClientBalance = async () => {
    // Not yet implemented against Appwrite. Leave empty to avoid blocking page render.
    setClientBalance(null);
  };

  const togglePortalAccess = async () => {
    if (!client) return;
    try {
      const updated = await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.clients,
        String(id),
        { portal_enabled: !client.portal_enabled }
      );
      setClient({ ...(updated as Client) });
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const deleteClient = async () => {
    if (!client) return;
    if (!confirm(`Are you sure you want to delete ${client.first_name} ${client.last_name}? This action cannot be undone.`)) {
      return;
    }
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.clients, String(id));
      navigate('/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Failed to delete client');
    }
  };

  const sendEmail = () => {
    if (client?.email) {
      window.location.href = `mailto:${client.email}`;
    }
  };

  const callClient = () => {
    if (client?.phones) {
      const phones = JSON.parse(client.phones);
      if (phones.length > 0) {
        window.location.href = `tel:${phones[0]}`;
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/clients')} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-200"
            aria-label="Back to clients list"
            title="Back to clients list"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="h-8 bg-white/20 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded w-32 mt-2 animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-4 bg-white/20 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/clients')} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-200"
            aria-label="Back to clients list"
            title="Back to clients list"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Client Not Found</h1>
          </div>
        </div>
        <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-200">{error || 'Client not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  const address = client.address ? JSON.parse(client.address) : null;
  const emergencyContact = client.emergency_contact ? JSON.parse(client.emergency_contact) : null;
  const phones = client.phones ? JSON.parse(client.phones) : [];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'billing', name: 'Billing', icon: DollarSign },
    { id: 'matters', name: 'Matters', icon: FolderOpen },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/clients')} 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-200"
            aria-label="Back to clients list"
            title="Back to clients list"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {client.first_name} {client.last_name}
            </h1>
            <p className="text-blue-200">Client #{client.client_number || id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {client.email && (
            <button
              onClick={sendEmail}
              className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </button>
          )}
          {phones.length > 0 && (
            <button
              onClick={callClient}
              className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 backdrop-blur-sm hover:bg-white/20"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call
            </button>
          )}
          <button
            onClick={() => navigate(`/clients/${id}/edit`)}
            className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 backdrop-blur-sm hover:bg-white/20"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </button>
          <button
            onClick={deleteClient}
            className="inline-flex items-center px-3 py-2 border border-red-400/30 text-sm font-medium rounded-lg text-red-200 bg-red-500/20 hover:bg-red-500/30"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Client Balance Overview */}
      {clientBalance && clientBalance.total_balance > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-900">Outstanding Balance</h3>
              <p className="text-3xl font-bold text-red-600">${clientBalance.total_balance.toLocaleString()}</p>
              <p className="text-sm text-red-700 mt-1">
                Total invoiced: ${clientBalance.total_invoiced.toLocaleString()} • 
                Total paid: ${clientBalance.total_paid.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <DollarSign className="h-12 w-12 text-red-400" />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
        <div className="border-b border-white/20">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-400 text-blue-300'
                      : 'border-transparent text-blue-200 hover:text-white hover:border-blue-300/50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
            <div className="flex items-center mb-4">
              <User className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-bright">Basic Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-200">Full Name</label>
                <p className="text-sm text-bright">{client.first_name} {client.last_name}</p>
              </div>
              {client.date_of_birth && (
                <div>
                  <label className="block text-sm font-medium text-blue-200">Date of Birth</label>
                  <p className="text-sm text-white">
                    {new Date(client.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
              )}
              {client.ssn_last4 && (
                <div>
                  <label className="block text-sm font-medium text-blue-200">SSN (Last 4)</label>
                  <p className="text-sm text-white">***-**-{client.ssn_last4}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-blue-200">Client Since</label>
                <p className="text-sm text-white">
                  {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
            <div className="flex items-center mb-4">
              <Mail className="h-5 w-5 text-green-400 mr-2" />
              <h3 className="text-lg font-semibold text-bright">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.email && (
                <div>
                  <label className="block text-sm font-medium text-blue-200">Email</label>
                  <p className="text-sm text-white">{client.email}</p>
                </div>
              )}
              {phones.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-blue-200">Phone Numbers</label>
                  <div className="space-y-1">
                    {phones.map((phone: string, index: number) => (
                      <p key={index} className="text-sm text-white">{phone}</p>
                    ))}
                  </div>
                </div>
              )}
              {client.preferred_contact_method && (
                <div>
                  <label className="block text-sm font-medium text-blue-200">Preferred Contact Method</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200">
                    {client.preferred_contact_method}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          {address && (address.street || address.city || address.state || address.zip) && (
            <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-5 w-5 text-purple-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Address</h3>
              </div>
              <div className="space-y-1">
                {address.street && <p className="text-sm text-white">{address.street}</p>}
                <p className="text-sm text-white">
                  {[address.city, address.state, address.zip].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {emergencyContact && (emergencyContact.name || emergencyContact.phone) && (
            <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-red-400 mr-2" />
                <h3 className="text-lg font-semibold text-white">Emergency Contact</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {emergencyContact.name && (
                  <div>
                    <label className="block text-sm font-medium text-blue-200">Name</label>
                    <p className="text-sm text-white">{emergencyContact.name}</p>
                  </div>
                )}
                {emergencyContact.relationship && (
                  <div>
                    <label className="block text-sm font-medium text-blue-200">Relationship</label>
                    <p className="text-sm text-white">{emergencyContact.relationship}</p>
                  </div>
                )}
                {emergencyContact.phone && (
                  <div>
                    <label className="block text-sm font-medium text-blue-200">Phone</label>
                    <p className="text-sm text-white">{emergencyContact.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Client Status */}
                <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
                  <div className="flex items-center mb-4">
                    <Settings className="h-5 w-5 text-blue-400 mr-2" />
                    <h3 className="text-lg font-semibold text-white">Client Portal</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-200">Portal Access</span>
                      <button
                        onClick={togglePortalAccess}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          client.portal_enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            client.portal_enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-200">Notifications</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.notifications_opt_in ? 'bg-green-500/20 text-green-200' : 'bg-gray-500/20 text-gray-200'
                      }`}>
                        {client.notifications_opt_in ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {client.portal_enabled && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-800">
                          Client can access their portal at: <br />
                          <code className="text-blue-600">/client-portal/{id}</code>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-200">Total Matters</span>
                      <span className="text-sm font-medium text-white">{matters.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-200">Active Matters</span>
                      <span className="text-sm font-medium text-white">
                        {matters.filter(m => m.status === 'Open').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-200">Client Since</span>
                      <span className="text-sm font-medium text-white">
                        {new Date(client.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {clientBalance && (
                      <>
                        <hr className="border-white/20" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-200">Total Invoiced</span>
                          <span className="text-sm font-medium text-white">
                            ${clientBalance.total_invoiced?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-200">Total Paid</span>
                          <span className="text-sm font-medium text-green-400">
                            ${clientBalance.total_paid?.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-blue-200">Balance Due</span>
                          <span className={`text-sm font-medium ${
                            clientBalance.total_balance > 0 ? 'text-red-400' : 'text-green-400'
                          }`}>
                            ${clientBalance.total_balance?.toLocaleString() || '0'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Billing Summary */}
              {clientBalance && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-2" />
                      <div>
                        <p className="text-xs font-medium text-blue-600">Total Invoiced</p>
                        <p className="text-lg font-bold text-blue-900">${clientBalance.total_invoiced?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-xs font-medium text-green-600">Total Paid</p>
                        <p className="text-lg font-bold text-green-900">${clientBalance.total_paid?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <div>
                        <p className="text-xs font-medium text-red-600">Balance Due</p>
                        <p className="text-lg font-bold text-red-900">${clientBalance.total_balance?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <FolderOpen className="h-5 w-5 text-purple-600 mr-2" />
                      <div>
                        <p className="text-xs font-medium text-purple-600">Matters</p>
                        <p className="text-lg font-bold text-purple-900">{clientBalance.matter_balances?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Balance by Matter */}
              {clientBalance && clientBalance.matter_balances && clientBalance.matter_balances.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-900">Balance by Matter</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {clientBalance.matter_balances.map((matter: Record<string, unknown>) => (
                      <div key={matter.matter_id} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <Link
                                to={`/matters/${matter.matter_id}`}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                              >
                                {matter.matter_number}
                              </Link>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-900">{matter.matter_title}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Invoiced:</span>
                                <span className="ml-1 font-medium">${matter.total_invoiced?.toLocaleString() || '0'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Paid:</span>
                                <span className="ml-1 font-medium text-green-600">${matter.total_paid?.toLocaleString() || '0'}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Balance:</span>
                                <span className={`ml-1 font-medium ${matter.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ${matter.balance?.toLocaleString() || '0'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/matters/${matter.matter_id}?tab=billing`}
                              className="p-2 text-gray-400 hover:text-blue-600"
                              title="View Matter Billing"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Invoices */}
              {clientBalance && clientBalance.recent_invoices && clientBalance.recent_invoices.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {clientBalance.recent_invoices.slice(0, 5).map((invoice: Record<string, unknown>) => {
                      const statusColors = {
                        Draft: 'bg-gray-100 text-gray-800',
                        Sent: 'bg-blue-100 text-blue-800',
                        Paid: 'bg-green-100 text-green-800',
                        Overdue: 'bg-red-100 text-red-800'
                      };

                      return (
                        <div key={invoice.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-1">
                                <Link
                                  to={`/billing/invoice/${invoice.id}`}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                                >
                                  Invoice #{invoice.invoice_number}
                                </Link>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                                  {invoice.status}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{invoice.matter_title}</span>
                                <span>Issued: {new Date(invoice.issue_date).toLocaleDateString()}</span>
                                <span>Due: {new Date(invoice.due_date).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900">${invoice.total?.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Payments */}
              {clientBalance && clientBalance.recent_payments && clientBalance.recent_payments.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {clientBalance.recent_payments.slice(0, 5).map((payment: Record<string, unknown>) => (
                      <div key={payment.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                Payment for Invoice #{payment.invoice_number}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{payment.matter_title}</span>
                              <span>{new Date(payment.received_at).toLocaleDateString()}</span>
                              <span>{payment.payment_method}</span>
                              {payment.reference && <span>Ref: {payment.reference}</span>}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">${payment.amount?.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!clientBalance || (clientBalance.recent_invoices?.length === 0 && clientBalance.recent_payments?.length === 0)) && (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                  <h3 className="text-sm font-medium text-white mb-2">No billing activity</h3>
                  <p className="text-sm text-blue-200 mb-4">This client has no invoices or payments yet.</p>
                  <button
                    onClick={() => navigate(`/matters/new?client_id=${id}`)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Matter
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'matters' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Client Matters</h3>
                <button
                  onClick={() => navigate(`/matters/new?client_id=${id}`)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Matter
                </button>
              </div>
              
              {matters.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="mx-auto h-12 w-12 text-blue-400" />
                  <h4 className="mt-2 text-sm font-medium text-white">No matters yet</h4>
                  <p className="mt-1 text-sm text-blue-200">Get started by creating a new matter for this client.</p>
                  <button
                    onClick={() => navigate(`/matters/new?client_id=${id}`)}
                    className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Matter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {matters.map((matter) => (
                    <div key={matter.id} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <Link
                          to={`/matters/${matter.id}`}
                          className="text-sm font-medium text-blue-300 hover:text-blue-200"
                        >
                          {matter.matter_number}
                        </Link>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          matter.status === 'Open' ? 'bg-green-500/20 text-green-300' :
                          matter.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300' :
                          matter.status === 'Closed' ? 'bg-gray-500/20 text-gray-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {matter.status}
                        </span>
                      </div>
                      <p className="text-sm text-white mb-2">{matter.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300">
                          {matter.practice_area === 'PersonalInjury' ? 'Personal Injury' : matter.practice_area}
                        </span>
                        <span className="text-xs text-blue-200">
                          {new Date(matter.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Status */}
          <div className="bg-white/8 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-blue-400 mr-2" />
              <h3 className="text-lg font-semibold text-white">Client Portal</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-200">Portal Access</span>
                <button
                  onClick={togglePortalAccess}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    client.portal_enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      client.portal_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-200">Notifications</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  client.notifications_opt_in ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {client.notifications_opt_in ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {client.portal_enabled && (
                <div className="mt-4 space-y-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <p className="text-xs text-blue-200 mb-2">
                      Client portal access link:
                    </p>
                    <Link
                      to={`/client-portal/${id}`}
                      className="inline-flex items-center px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      <Eye className="mr-2 h-3 w-3" />
                      View Portal
                    </Link>
                  </div>
                  <div className="text-xs text-blue-200">
                    Share this link: <br />
                    <code className="text-blue-300 bg-blue-500/20 px-1 rounded">
                      {window.location.origin}/client-portal/{id}
                    </code>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/8 backdrop-blur-xl rounded-xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-200">Total Matters</span>
                <span className="text-sm font-medium text-white">{matters.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-200">Active Matters</span>
                <span className="text-sm font-medium text-white">
                  {matters.filter(m => m.status === 'Open').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-200">Client Since</span>
                <span className="text-sm font-medium text-white">
                  {new Date(client.created_at).toLocaleDateString()}
                </span>
              </div>
              {clientBalance && (
                <>
                  <hr className="border-white/20" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-200">Total Invoiced</span>
                    <span className="text-sm font-medium text-white">
                      ${clientBalance.total_invoiced?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-200">Total Paid</span>
                    <span className="text-sm font-medium text-green-400">
                      ${clientBalance.total_paid?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-200">Balance Due</span>
                    <span className={`text-sm font-medium ${
                      clientBalance.total_balance > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      ${clientBalance.total_balance?.toLocaleString() || '0'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
