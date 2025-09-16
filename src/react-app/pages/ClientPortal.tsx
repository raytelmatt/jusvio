/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/react-app/lib/backend';
import { 
  FolderOpen, 
  FileText, 
  MessageSquare, 
  DollarSign,
  Calendar,
  Download,
  Eye,
  User
} from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  client_number: string;
}

interface Matter {
  id: string;
  title: string;
  matter_number: string;
  status: string;
  practice_area: string;
  opened_at: string;
  fee_model: string;
  description: string;
}

interface Document {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface Message {
  id: string;
  subject: string;
  body: string;
  sent_at: string;
  direction: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  total: number;
  status: string;
  due_date: string;
}

interface Hearing {
  id: string;
  hearing_type: string;
  scheduled_at: string;
  location: string;
}

interface ClientPortalData {
  client: Client;
  matters: Matter[];
  documents: Document[];
  messages: Message[];
  invoices: Invoice[];
  upcomingHearings: Hearing[];
}

export default function ClientPortal() {
  const { clientId } = useParams();
  const [data, setData] = useState<ClientPortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchClientPortalData = useCallback(async () => {
    try {
      // Load client
      const client = await databases.getDocument(DATABASE_ID, COLLECTIONS.clients, String(clientId));

      // Load matters for client
      const matterList = await databases.listDocuments(DATABASE_ID, COLLECTIONS.matters, [
        Query.equal('client_id', String(clientId)),
        Query.limit(1000),
      ]);
      const matters = (matterList.documents || []).map((d: any) => ({
        id: String(d.id ?? d.$id),
        title: String(d.title || ''),
        matter_number: String(d.matter_number || ''),
        status: String(d.status || ''),
        practice_area: String(d.practice_area || ''),
        opened_at: String(d.opened_at || d.created_at || d.$createdAt || ''),
        fee_model: String(d.fee_model || ''),
        description: (d.description as string) || '',
      })) as Matter[];

      const matterIds = new Set(matters.map(m => String(m.id)));

      // Load documents linked to those matters
      const docsRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.documents, [Query.limit(1000)]);
      const documents = (docsRes.documents || [])
        .filter((doc: any) => matterIds.has(String(doc.matter_id)))
        .map((doc: any) => ({
          id: String(doc.id ?? doc.$id),
          title: String(doc.title || ''),
          status: String(doc.status || 'Draft'),
          created_at: String(doc.created_at || doc.$createdAt || ''),
        })) as Document[];

      // Load communications for those matters
      const commRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.communications, [Query.limit(1000)]);
      const messages = (commRes.documents || [])
        .filter((c: any) => matterIds.has(String(c.matter_id)))
        .map((c: any) => ({
          id: String(c.id ?? c.$id),
          subject: String(c.subject || ''),
          body: String(c.body || ''),
          sent_at: String(c.sent_at || c.$createdAt || ''),
          direction: String(c.direction || 'Inbound'),
        })) as Message[];

      // Load invoices for those matters
      const invRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.invoices, [Query.limit(1000)]);
      const invoices = (invRes.documents || [])
        .filter((inv: any) => matterIds.has(String(inv.matter_id)))
        .map((inv: any) => ({
          id: String(inv.id ?? inv.$id),
          invoice_number: String(inv.invoice_number || ''),
          total: Number(inv.total || inv.amount || 0),
          status: String(inv.status || 'Draft'),
          due_date: String(inv.due_date || ''),
        })) as Invoice[];

      // Load upcoming hearings
      const hearRes = await databases.listDocuments(DATABASE_ID, COLLECTIONS.hearings, [Query.limit(1000)]);
      const upcomingHearings = (hearRes.documents || [])
        .filter((h: any) => matterIds.has(String(h.matter_id)))
        .map((h: any) => ({
          id: String(h.id ?? h.$id),
          hearing_type: String(h.hearing_type || ''),
          scheduled_at: String(h.start_at || ''),
          location: String(h.court_name || h.courtroom || ''),
        })) as Hearing[];

      const clientData: Client = {
        id: String(client.id ?? (client as any).$id ?? ''),
        first_name: String((client as any).first_name || ''),
        last_name: String((client as any).last_name || ''),
        email: String((client as any).email || ''),
        client_number: String((client as any).client_number || ''),
      };

      setData({
        client: clientData,
        matters,
        documents,
        messages,
        invoices,
        upcomingHearings,
      });
    } catch (error) {
      console.error('Error fetching client portal data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientPortalData();
  }, [fetchClientPortalData]);

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'matters', name: 'My Cases', icon: FolderOpen },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'messages', name: 'Messages', icon: MessageSquare },
    { id: 'billing', name: 'Billing', icon: DollarSign },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view this client portal.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {data.client.first_name}
              </h1>
              <p className="text-gray-600">Your legal matters and updates</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {data.client.first_name} {data.client.last_name}
                </p>
                <p className="text-sm text-gray-500">{data.client.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                {data.client.first_name?.charAt(0)}{data.client.last_name?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Cases</p>
                <p className="text-2xl font-bold text-gray-900">{data.matters.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Documents</p>
                <p className="text-2xl font-bold text-gray-900">{data.documents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">{data.messages.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{data.upcomingHearings.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
              <div className="space-y-6">
                {/* Upcoming Hearings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Court Dates</h3>
                  {data.upcomingHearings.length > 0 ? (
                    <div className="space-y-3">
                      {data.upcomingHearings.map((hearing: Hearing) => (
                        <div key={hearing.id} className="flex items-center p-4 bg-blue-50 rounded-lg">
                          <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{hearing.hearing_type}</p>
                            <p className="text-sm text-gray-600">{hearing.hearing_type}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(hearing.scheduled_at).toLocaleDateString()} at {new Date(hearing.scheduled_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No upcoming court dates scheduled.</p>
                  )}
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">New document uploaded</p>
                        <p className="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 hover:bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Message from your attorney</p>
                        <p className="text-xs text-gray-500">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'matters' && (
              <div className="space-y-4">
                {data.matters.map((matter: Matter) => (
                  <div key={matter.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{matter.title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(matter.status)}`}>
                        {matter.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Practice Area</p>
                        <p className="font-medium">{matter.practice_area}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Matter Number</p>
                        <p className="font-medium">{matter.matter_number}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Opened</p>
                        <p className="font-medium">{new Date(matter.opened_at || matter.opened_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fee Structure</p>
                        <p className="font-medium">{matter.fee_model === 'FlatRate' ? 'Flat Rate' : 'Hourly'}</p>
                      </div>
                    </div>
                    {matter.description && (
                      <div className="mt-4">
                        <p className="text-gray-500 text-sm">Description</p>
                        <p className="text-gray-900">{matter.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                {data.documents.length > 0 ? (
                  data.documents.map((doc: Document) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">{doc.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600" aria-label="View Document">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-gray-600" aria-label="Download Document">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No documents available.</p>
                )}
              </div>
            )}

            {activeTab === 'messages' && (
              <div className="space-y-4">
                {data.messages.length > 0 ? (
                  data.messages.map((message: Message) => (
                    <div key={message.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          {message.direction === 'Inbound' ? 'You' : 'Your Attorney'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(message.sent_at).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-gray-700">{message.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No messages yet.</p>
                )}
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-4">
                {data.invoices.length > 0 ? (
                  data.invoices.map((invoice: Invoice) => (
                    <div key={invoice.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">Invoice #{invoice.invoice_number}</p>
                          <p className="text-sm text-gray-500">
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900">${invoice.total}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                            invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                      {invoice.status !== 'Paid' && (
                        <button className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                          Pay Now
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No invoices available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
