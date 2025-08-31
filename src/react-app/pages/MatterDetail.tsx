import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { 
  ArrowLeft, 
  Edit, 
  Clock, 
  FileText, 
  DollarSign,
  MessageSquare,
  CheckSquare,
  User,
  Mail,
  Save,
  Calendar,
  AlertCircle,
  Phone,
  // MessageCircle
} from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';
import { databases } from '../lib/appwrite';
import { Query, ID } from 'appwrite';
import { Matter, Document, Communication } from '@/shared/types';
// import { Invoice, Payment } from '../../shared/types';

const DATABASE_ID = 'jusivo';
const COLLECTIONS = {
  timeEntries: 'time_entries',
  invoices: 'invoices', 
  payments: 'payments',
  matters: 'matters',
  hearings: 'hearings',
  tasks: 'tasks',
  documents: 'documents',
  communications: 'communications',
  deadlines: 'deadlines'
};

// interface TimelineEventDisplay {
//   id?: string;
//   type: 'document' | 'communication' | 'hearing' | 'payment' | 'invoice';
//   title: string;
//   date: string;
//   description?: string;
//   status?: string;
//   amount?: number;
// }

// interface BillingStats {
//   totalHours: number;
//   totalAmount: number;
//   totalPaid: number;
//   balance: number;
//   totalTime: number;
//   totalInvoiced: number;
//   outstanding: number;
//   totalAmountDue: number;
//   unbilledTime: number;
// }

// interface Task {
//   id: number;
//   matter_id: number;
//   title: string;
//   description: string;
//   status: 'Open' | 'InProgress' | 'Completed';
//   priority: 'Low' | 'Medium' | 'High';
//   due_at: string | null;
//   assignee_ids: string[];
//   created_at: string;
//   updated_at: string;
// }

interface HearingForm {
  hearing_type: string;
  start_at: string;
  end_at: string;
  courtroom: string;
  judge_or_alj: string;
  notes: string;
  is_ssa_hearing: boolean;
  court_id: number | null;
}

// interface TaskForm {
//   title: string;
//   description: string;
//   due_at: string;
//   priority: 'Low' | 'Medium' | 'High';
//   assignee_ids: string[];
//   status: 'Open' | 'InProgress' | 'Completed';
// }

export default function MatterDetail() {
  const { id } = useParams();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [hearings, setHearings] = useState<unknown[]>([]);
  const [tasks, setTasks] = useState<unknown[]>([]);
  const [criminalData, setCriminalData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [previewDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [invoices, setInvoices] = useState<unknown[]>([]);
  const [hearingForm, setHearingForm] = useState<HearingForm>({
    hearing_type: '',
    start_at: '',
    end_at: '',
    courtroom: '',
    judge_or_alj: '',
    notes: '',
    is_ssa_hearing: false,
    court_id: null
  });

  useEffect(() => {
    if (id) {
      fetchMatter();
    }
  }, [id]);

  useEffect(() => {
    if (!id || !matter) return;
    
    if (activeTab === 'timeline') {
      fetchTimelineEvents();
    } else if (activeTab === 'billing') {
      fetchBillingData();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'communications') {
      fetchCommunications();
    } else if (activeTab === 'tasks') {
      fetchTasks();
    } else if (activeTab === 'settings') {
      fetchHearings();
    }
  }, [activeTab, id, matter]);

  const fetchMatter = async () => {
    if (!id) {
      setError('No matter ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Fetching matter with ID:', id);
      const res = await databases.getDocument(
        'jusivo',
        'matters',
        id,
      );
      const matter = res.documents?.[0];
      const invoicesData = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.invoices,
        [Query.equal('matter_id', id)]
      );
      const invoicesWithDetails = invoicesData.documents?.map((inv: Record<string, unknown>) => ({
        ...inv,
        amount: (inv.amount as number) || 0,
      }));
      const matterData: Record<string, unknown> = {
        ...matter,
        id: matter.$id,
      } as unknown as Matter;
      setCriminalData(matter.criminal_data || {});
      setMatter(matterData);
      setInvoices(invoicesWithDetails);
      setError(null);
    } catch (error) {
      console.error('Error fetching matter:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch matter');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimelineEvents = async () => {
    if (!id) return;
    try {
      const [timeList, hearingList, deadlineList, commList, docList] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.timeEntries, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.hearings, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.deadlines, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.communications, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.documents, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
      ]);

      const events: any[] = [];

      if (matter) {
        events.push({
          id: `matter-${String(matter.id ?? (matter as any).$id)}`,
          type: 'matter_created',
          title: 'Matter Opened',
          description: `${matter.title} was opened`,
          date: (matter as any).opened_at || (matter as any).created_at,
          icon: FileText,
          color: 'blue',
        });
      }

      const timeEntries: unknown[] = [];
      const invoicesData: unknown[] = [];
      setInvoices(invoicesData);

      (timeList.documents || []).forEach((entry: any) => {
        const hours = Number(entry.hours || 0);
        const rate = Number(entry.rate || 0);
        events.push({
          id: `time-${entry.id ?? entry.$id}`,
          type: 'time_entry',
          title: 'Time Entry',
          description: entry.description,
          date: entry.entry_date,
          icon: Clock,
          color: 'green',
          meta: `${hours}h @ $${rate}/hr = $${(hours * rate).toFixed(2)}`,
        });
      });

      (docList.documents || []).forEach((doc: any) => {
        events.push({
          id: `doc-${doc.id ?? doc.$id}`,
          type: 'document',
          title: 'Document Created',
          description: doc.title,
          date: doc.created_at ?? doc.$createdAt,
          icon: FileText,
          color: 'purple',
          meta: `Version ${doc.version} • ${doc.status}`,
        });
      });

      (hearingList.documents || []).forEach((hearing: any) => {
        events.push({
          id: `hearing-${hearing.id ?? hearing.$id}`,
          type: 'hearing',
          title: hearing.hearing_type || 'Hearing',
          description: `${hearing.courtroom ? `Courtroom ${hearing.courtroom}` : ''} ${hearing.judge_or_alj ? `- ${hearing.judge_or_alj}` : ''}`.trim(),
          date: hearing.start_at,
          icon: Calendar,
          color: 'red',
          meta: hearing.court_name,
        });
      });

      (deadlineList.documents || []).forEach((deadline: any) => {
        events.push({
          id: `deadline-${deadline.id ?? deadline.$id}`,
          type: 'deadline',
          title: deadline.title,
          description: `${deadline.source} deadline`,
          date: deadline.due_at,
          icon: AlertCircle,
          color: deadline.status === 'Completed' ? 'green' : 'orange',
          meta: deadline.status,
        });
      });

      (commList.documents || []).forEach((comm: any) => {
        events.push({
          id: `comm-${comm.id ?? comm.$id}`,
          type: 'communication',
          title: `${comm.channel} ${comm.direction}`,
          description: comm.body?.substring(0, 100) + (comm.body?.length > 100 ? '...' : ''),
          date: comm.sent_at || comm.created_at || comm.$createdAt,
          icon: comm.channel === 'Phone' ? Phone : Mail,
          color: comm.direction === 'Inbound' ? 'blue' : 'indigo',
        });
      });

      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      // setTimelineEvents(events);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
    }
  };

  const fetchBillingData = async () => {
    if (!id) return;
    try {
      const [, , ] = await Promise.all([
        databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.timeEntries,
          [Query.equal('matter_id', id!)]
        ),
        databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.invoices,
          [Query.equal('matter_id', id!)]
        ),
        databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.payments,
          [Query.equal('matter_id', id!)]
        ),
      ]);

      // Future: Process billing data
      console.log('Billing data fetched successfully');
    } catch (error) {
      console.error('Error fetching billing data:', error);
    }
  };

  const saveCriminalData = async () => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.matters,
        String(id),
        {
          criminal_data: JSON.stringify(criminalData || {}),
        }
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating criminal case data:', error);
    }
  };

  const fetchHearings = async () => {
    if (!id) return;
    try {
      const list = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.hearings,
        [Query.equal('matter_id', String(id))]
      );
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      }));
      setHearings(rows);
    } catch (error) {
      console.error('Error fetching hearings:', error);
    }
  };

  const createHearing = async () => {
    if (!id) return;
    try {
      const payload: Record<string, unknown> = {
        ...hearingForm,
        matter_id: String(id),
        start_at: hearingForm.start_at ? new Date(hearingForm.start_at).toISOString() : null,
        end_at: hearingForm.end_at ? new Date(hearingForm.end_at).toISOString() : null,
        is_ssa_hearing: hearingForm.is_ssa_hearing || matter?.practice_area === 'SSD',
      };
      const created = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.hearings,
        ID.unique(),
        payload
      );
      await fetchHearings();
      setHearingForm({
        hearing_type: '',
        start_at: '',
        end_at: '',
        courtroom: '',
        judge_or_alj: '',
        notes: '',
        is_ssa_hearing: false,
        court_id: null,
      });
      if ((created as Record<string, unknown>).start_at && id) {
        await createHearingDeadline(created);
      }
    } catch (error) {
      console.error('Error creating hearing:', error);
    }
  };

  const updateHearing = async (hearingId: string, updates: any) => {
    if (!id) return;
    try {
      const payload: Record<string, unknown> = {
        ...updates,
        start_at: updates.start_at ? new Date(updates.start_at as string).toISOString() : null,
        end_at: updates.end_at ? new Date(updates.end_at as string).toISOString() : null,
      };
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.hearings,
        hearingId,
        payload
      );
      await fetchHearings();
    } catch (error) {
      console.error('Error updating hearing:', error);
    }
  };

  const deleteHearing = async (hearingId: string) => {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.hearings,
        hearingId
      );
      fetchHearings();
    } catch (error) {
      console.error('Error deleting hearing:', error);
    }
  };

  const createHearingDeadline = async (hearing: Record<string, unknown>) => {
    if (!id) return;
    try {
      const hearingDate = new Date(hearing.start_at as string);
      const deadlineDate = new Date(hearingDate);
      deadlineDate.setDate(deadlineDate.getDate() - 7);
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.deadlines,
        ID.unique(),
        {
          matter_id: String(id),
          title: `Prepare for ${hearing.hearing_type || 'Court Appearance'}`,
          source: 'CourtOrder',
          due_at: deadlineDate.toISOString(),
          trigger_event_id: String(hearing.id ?? hearing.$id),
          status: 'Open',
        }
      );
    } catch (error) {
      console.error('Error creating hearing deadline:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!id) return;
    
    try {
      const list = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.documents,
        [Query.equal('matter_id', String(id))]
      );
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      }));
      setDocuments(rows);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchCommunications = async () => {
    if (!id) return;
    try {
      const list = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.communications,
        [Query.equal('matter_id', String(id))]
      );
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      }));
      setCommunications(rows);
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const fetchTasks = async () => {
    if (!id) return;
    try {
      const list = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.tasks,
        [Query.equal('matter_id', String(id))]
      );
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      }));
      setTasks(rows);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createTask = async () => {
    if (!id) return;
    try {
      const payload: Record<string, unknown> = {
        matter_id: String(id),
        title: 'New Task',
        description: '',
        status: 'pending',
        priority: 'medium',
        due_date: new Date().toISOString().split('T')[0],
        assigned_to: ''
      };
      
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.tasks,
        ID.unique(),
        payload
      );
      
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (taskId: number, updates: Record<string, unknown>) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.tasks,
        taskId.toString(),
        updates
      );
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.tasks,
        String(taskId)
      );
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const deleteDocument = async (docId: string | number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.documents,
        String(docId)
      );
      setDocuments(documents.filter(doc => String(doc.id ?? doc.$id) !== String(docId)));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  // const openPreview = (document: any) => {
  //   setPreviewDocument(document);
  //   setShowPreview(true);
  // };

  // const closePreview = () => {
  //   setShowPreview(false);
  //   setPreviewDocument(null);
  // };

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'Draft': return 'bg-yellow-100 text-yellow-800';
  //     case 'Final': return 'bg-green-100 text-green-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getChannelIcon = (channel: string) => {
  //   switch (channel) {
  //     case 'Email': return Mail;
  //     case 'Phone': return Phone;
  //     case 'SMS': return MessageCircle;
  //     case 'Portal': return MessageSquare;
  //     default: return MessageSquare;
  //   }
  // };

  // const getChannelColor = (channel: string) => {
  //   switch (channel) {
  //     case 'Email': return 'bg-blue-100 text-blue-600';
  //     case 'Phone': return 'bg-green-100 text-green-600';
  //     case 'SMS': return 'bg-purple-100 text-purple-600';
  //     case 'Portal': return 'bg-orange-100 text-orange-600';
  //     default: return 'bg-gray-100 text-gray-600';
  //   }
  // };

  // const getDirectionColor = (direction: string) => {
  //   return direction === 'Inbound' 
  //     ? 'bg-blue-50 border-l-4 border-l-blue-500' 
  //     : 'bg-green-50 border-l-4 border-l-green-500';
  // };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'timeline', name: 'Timeline', icon: Clock },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'billing', name: 'Billing', icon: DollarSign },
    { id: 'communications', name: 'Communications', icon: MessageSquare },
    { id: 'tasks', name: 'Tasks', icon: CheckSquare },
    { id: 'settings', name: 'Court Settings', icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/matters" className="p-2 hover:bg-white/10 rounded-lg text-blue-200 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-8 bg-white/20 rounded w-64 animate-pulse"></div>
        </div>
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-white/20 rounded w-1/4"></div>
            <div className="h-4 bg-white/20 rounded w-1/2"></div>
            <div className="h-4 bg-white/20 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/matters" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Error Loading Matter</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchMatter();
            }}
            className="mt-2 text-red-700 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!matter) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Matter not found</p>
        <Link to="/matters" className="text-blue-600 hover:text-blue-700">
          Back to matters
        </Link>
      </div>
    );
  }

  const practiceAreaColors = {
    Criminal: 'bg-red-100 text-red-800',
    PersonalInjury: 'bg-blue-100 text-blue-800',
    SSD: 'bg-green-100 text-green-800',
  };

  const statusColors = {
    Intake: 'bg-yellow-100 text-yellow-800',
    Open: 'bg-green-100 text-green-800',
    Pending: 'bg-blue-100 text-blue-800',
    Closed: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/matters" className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-200 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{matter.title}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-blue-200">Matter #{matter.matter_number}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                practiceAreaColors[matter.practice_area as keyof typeof practiceAreaColors]
              }`}>
                {matter.practice_area === 'PersonalInjury' ? 'Personal Injury' : matter.practice_area}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[matter.status as keyof typeof statusColors]
              }`}>
                {matter.status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing && (
            <button
              onClick={saveCriminalData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            <Edit className="mr-2 h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
            {matter.client_first_name?.charAt(0)}{matter.client_last_name?.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {matter.client_first_name} {matter.client_last_name}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-blue-200">
              {matter.client_email && (
                <div className="flex items-center">
                  <Mail className="mr-1 h-3 w-3" />
                  {matter.client_email}
                </div>
              )}
              <span>Opened: {new Date(matter.opened_at || matter.created_at).toLocaleDateString()}</span>
              <span className="capitalize">
                {matter.fee_model === 'FlatRate' ? 'Flat Rate' : 'Progressive'} Billing
              </span>
            </div>
          </div>
        </div>
      </div>

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
                      : 'border-transparent text-blue-200 hover:text-white hover:border-white/30'
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
              {matter.description && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Matter Description</h4>
                  <p className="text-sm text-blue-200">{matter.description}</p>
                </div>
              )}

              {matter.practice_area === 'Criminal' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">Case Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-blue-200 mb-1">Case Number</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={(criminalData.case_number as string) || ''}
                            onChange={(e) => setCriminalData({...criminalData, case_number: e.target.value})}
                            className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                            title="Case Number"
                            placeholder="Enter case number"
                            aria-label="Case Number"
                          />
                        ) : (
                          <p className="text-sm text-white">{(criminalData.case_number as string) || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Disposition</label>
                        <input
                          type="text"
                          title="Disposition"
                          placeholder="Enter disposition"
                          aria-label="Disposition"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={(criminalData.disposition as string) || ''}
                          onChange={(e) => setCriminalData({...criminalData, disposition: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Jurisdiction</label>
                        <input
                          type="text"
                          value={(criminalData.jurisdiction as string) || ''}
                          onChange={(e) => setCriminalData({...criminalData, jurisdiction: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          title="Jurisdiction"
                          placeholder="Enter jurisdiction"
                          aria-label="Jurisdiction"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Arrest Date</label>
                        <input
                          type="date"
                          value={(criminalData.arrest_date as string) || ''}
                          onChange={(e) => setCriminalData({...criminalData, arrest_date: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          title="Arrest Date"
                          aria-label="Arrest Date"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Charges</label>
                        <input
                          type="text"
                          title="Charges"
                          placeholder="Enter charges"
                          aria-label="Charges"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={(criminalData.charges as string) || ''}
                          onChange={(e) => setCriminalData({...criminalData, charges: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Documents</h4>
                <button
                  onClick={() => fetchDocuments()}
                  className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  Refresh Documents
                </button>
              </div>
              
              <div className="space-y-3">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-blue-200">
                    <p>No documents found for this matter.</p>
                  </div>
                ) : (
                  documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-300" />
                        <div>
                          <p className="text-sm font-medium text-white">{doc.title}</p>
                          <p className="text-xs text-blue-200">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Communications</h4>
              {communications.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  <p>No communications found for this matter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {communications.map((comm: any) => (
                    <div key={comm.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-white">{comm.subject}</h5>
                          <p className="text-sm text-blue-200 mt-1">{comm.content}</p>
                        </div>
                        <span className="text-xs text-blue-300">
                          {new Date(comm.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Billing & Invoices</h4>
              {invoices.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  <p>No invoices found for this matter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice: any) => (
                    <div key={invoice.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-white">Invoice #{invoice.invoice_number}</h5>
                          <p className="text-sm text-blue-200">
                            Due: {new Date(invoice.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">${invoice.total.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {showPreview && previewDocument && (
        <DocumentPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          document={previewDocument as any}
        />
      )}
    </div>
  );
}
