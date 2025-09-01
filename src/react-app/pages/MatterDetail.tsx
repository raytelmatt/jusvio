import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
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
  Calendar,
  AlertCircle,
  Phone
} from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';
import { databases, DATABASE_ID, COLLECTIONS } from '../lib/appwrite';
import { Query } from 'appwrite';
import { Matter, Document, Communication } from '@/shared/types';
// import { Invoice, Payment } from '../../shared/types';

type TimelineEventDisplay = {
  id: string;
  title: string;
  date?: string;
  description?: string;
  icon?: unknown;
  color?: string;
  meta?: string;
};

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

// interface HearingForm {
//   hearing_type: string;
//   start_at: string;
//   end_at: string;
//   courtroom: string;
//   judge_or_alj: string;
//   notes: string;
//   is_ssa_hearing: boolean;
//   court_id: string | null;
// }

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
  const navigate = useNavigate();
  const [matter, setMatter] = useState<Matter | null>(null);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [hearings, setHearings] = useState<unknown[]>([]);
  const [tasks, setTasks] = useState<unknown[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventDisplay[]>([]);
  
  // Suppress unused variable warnings - these are set by fetch functions
  void hearings;
  void tasks;
  const [criminalData, setCriminalData] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [invoices, setInvoices] = useState<unknown[]>([]);
  // Commenting out unused form state
  // const [hearingForm] = useState<HearingForm>({
  //   hearing_type: '',
  //   start_at: '',
  //   end_at: '',
  //   courtroom: '',
  //   judge_or_alj: '',
  //   notes: '',
  //   is_ssa_hearing: false,
  //   court_id: null
  // });

  useEffect(() => {
    if (id) {
      fetchMatter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, id, matter]);

  const fetchMatter = async () => {
    if (!id) {
      setError('No matter ID provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.matters,
        id,
      );
      const matter = res as unknown as Record<string, unknown>;
      const invoicesData = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.invoices,
        [Query.equal('matter_id', id)]
      );
      const invoicesWithDetails = invoicesData.documents?.map((inv: Record<string, unknown>) => ({
        ...inv,
        // Ensure numeric fields for UI formatting
        amount: Number(inv.amount ?? 0),
        total: Number(inv.total ?? inv.amount ?? 0),
      }));
      // Parse practice-area structured data stored as JSON string in 'case_data'
      const rawCaseData = (matter.case_data as string | undefined) ?? '';
      let parsedCaseData: Record<string, unknown> = {};
      if (typeof rawCaseData === 'string' && rawCaseData.trim().length > 0) {
        try {
          parsedCaseData = JSON.parse(rawCaseData) as Record<string, unknown>;
        } catch {
          parsedCaseData = {};
        }
      }
      setCriminalData(parsedCaseData);
      setMatter(matter as unknown as Matter);
      setInvoices(invoicesWithDetails || []);
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
      const [timeList, invoiceList, hearingList, deadlineList, communicationList, docList] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.timeEntries, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.invoices, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.hearings, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.deadlines, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.communications, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.documents, [Query.equal('matter_id', String(id))]).catch(() => ({ documents: [] })),
      ]);

      const events: TimelineEventDisplay[] = [];

      if (matter) {
        events.push({
          id: `matter-${String((matter as Record<string, unknown>).id ?? (matter as Record<string, unknown>).$id)}`,
          title: 'Matter Opened',
          description: `${(matter as Record<string, unknown>).title as string} was opened`,
          date: String((matter as Record<string, unknown>).opened_at || (matter as Record<string, unknown>).created_at || ''),
          icon: FileText,
          color: 'blue',
        });
      }

      // Remove unused variables to clean up lints

      (timeList.documents || []).forEach((entry: Record<string, unknown>) => {
        const hours = Number(entry.hours || 0);
        const rate = Number(entry.rate || 0);
        events.push({
          id: `time-${String((entry as Record<string, unknown>).id ?? (entry as Record<string, unknown>).$id)}`,
          title: 'Time Entry',
          description: String(entry.description ?? ''),
          date: String(entry.entry_date ?? (entry as Record<string, unknown>).$createdAt ?? ''),
          icon: Clock,
          color: 'green',
          meta: `${hours}h @ $${rate}/hr = $${(hours * rate).toFixed(2)}`,
        });
      });

      (invoiceList.documents || []).forEach((invoice: Record<string, unknown>) => {
        events.push({
          id: `invoice-${String((invoice as Record<string, unknown>).id ?? (invoice as Record<string, unknown>).$id)}`,
          title: 'Invoice Created',
          description: String((invoice as Record<string, unknown>).title ?? ''),
          date: String((invoice as Record<string, unknown>).created_at ?? (invoice as Record<string, unknown>).$createdAt ?? ''),
          icon: FileText,
          color: 'purple',
          meta: `Version ${String((invoice as Record<string, unknown>).version ?? '')} • ${String((invoice as Record<string, unknown>).status ?? '')}`,
        });
      });

      (docList.documents || []).forEach((doc: Record<string, unknown>) => {
        events.push({
          id: `doc-${String((doc as Record<string, unknown>).id ?? (doc as Record<string, unknown>).$id)}`,
          title: 'Document Created',
          description: String((doc as Record<string, unknown>).title ?? ''),
          date: String((doc as Record<string, unknown>).created_at ?? (doc as Record<string, unknown>).$createdAt ?? ''),
          icon: FileText,
          color: 'purple',
          meta: `Version ${String((doc as Record<string, unknown>).version ?? '')} • ${String((doc as Record<string, unknown>).status ?? '')}`,
        });
      });

      (hearingList.documents || []).forEach((hearing: Record<string, unknown>) => {
        events.push({
          id: `hearing-${String((hearing as Record<string, unknown>).id ?? (hearing as Record<string, unknown>).$id)}`,
          title: String((hearing as Record<string, unknown>).hearing_type || 'Hearing'),
          description: `${(hearing as Record<string, unknown>).courtroom ? `Courtroom ${(hearing as Record<string, unknown>).courtroom}` : ''} ${(hearing as Record<string, unknown>).judge_or_alj ? `- ${(hearing as Record<string, unknown>).judge_or_alj}` : ''}`.trim(),
          date: String((hearing as Record<string, unknown>).start_at ?? ''),
          icon: Calendar,
          color: 'red',
          meta: String((hearing as Record<string, unknown>).court_name ?? ''),
        });
      });

      (deadlineList.documents || []).forEach((deadline: Record<string, unknown>) => {
        events.push({
          id: `deadline-${String((deadline as Record<string, unknown>).id ?? (deadline as Record<string, unknown>).$id)}`,
          title: String((deadline as Record<string, unknown>).title ?? 'Deadline'),
          description: `${String((deadline as Record<string, unknown>).source ?? '')} deadline`,
          date: String((deadline as Record<string, unknown>).due_at ?? ''),
          icon: AlertCircle,
          color: (deadline as Record<string, unknown>).status === 'Completed' ? 'green' : 'orange',
          meta: String((deadline as Record<string, unknown>).status ?? ''),
        });
      });

      (communicationList.documents || []).forEach((comm: Record<string, unknown>) => {
        events.push({
          id: `comm-${String((comm as Record<string, unknown>).id ?? (comm as Record<string, unknown>).$id)}`,
          title: `${String((comm as Record<string, unknown>).channel ?? '')} ${String((comm as Record<string, unknown>).direction ?? '')}`.trim(),
          description: String((comm as Record<string, unknown>).body ?? '').substring(0, 100) + (String((comm as Record<string, unknown>).body ?? '').length > 100 ? '...' : ''),
          date: String((comm as Record<string, unknown>).sent_at || (comm as Record<string, unknown>).created_at || (comm as Record<string, unknown>).$createdAt || ''),
          icon: (comm as Record<string, unknown>).channel === 'Phone' ? Phone : Mail,
          color: (comm as Record<string, unknown>).direction === 'Inbound' ? 'blue' : 'indigo',
        });
      });

      events.sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());
      setTimelineEvents(events);
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
    } catch (error) {
      console.error('Error fetching billing data:', error);
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
      const rows = (list.documents || []).map((d: Record<string, unknown>) => ({
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

  // const createHearing = async () => {
  //   if (!id) return;
  //   try {
  //     const payload: Record<string, unknown> = {
  //       ...hearingForm,
  //       matter_id: String(id),
  //       start_at: hearingForm.start_at ? new Date(hearingForm.start_at).toISOString() : null,
  //       end_at: hearingForm.end_at ? new Date(hearingForm.end_at).toISOString() : null,
  //       is_ssa_hearing: hearingForm.is_ssa_hearing || matter?.practice_area === 'SSD',
  //     };
  //     const created = await databases.createDocument(
  //       DATABASE_ID,
  //       COLLECTIONS.hearings,
  //       ID.unique(),
  //       payload
  //     );
  //     await fetchHearings();
  //     setHearingForm({
  //       hearing_type: '',
  //       start_at: '',
  //       end_at: '',
  //       courtroom: '',
  //       judge_or_alj: '',
  //       notes: '',
  //       is_ssa_hearing: false,
  //       court_id: null,
  //     });
  //     if ((created as Record<string, unknown>).start_at && id) {
  //       await createHearingDeadline(created);
  //     }
  //   } catch (error) {
  //     console.error('Error creating hearing:', error);
  //   }
  // };

  // const updateHearing = async (hearingId: string, updates: Record<string, unknown>) => {
  //   if (!id) return;
  //   try {
  //     const payload: Record<string, unknown> = {
  //       ...updates,
  //       start_at: updates.start_at ? new Date(updates.start_at as string).toISOString() : null,
  //       end_at: updates.end_at ? new Date(updates.end_at as string).toISOString() : null,
  //     };
  //     await databases.updateDocument(
  //       DATABASE_ID,
  //       COLLECTIONS.hearings,
  //       hearingId,
  //       payload
  //     );
  //     await fetchHearings();
  //   } catch (error) {
  //     console.error('Error updating hearing:', error);
  //   }
  // };

  // const deleteHearing = async (hearingId: string) => {
  //   try {
  //     await databases.deleteDocument(
  //       DATABASE_ID,
  //       COLLECTIONS.hearings,
  //       hearingId
  //     );
  //     fetchHearings();
  //   } catch (error) {
  //     console.error('Error deleting hearing:', error);
  //   }
  // };

  // const createHearingDeadline = async (hearing: Record<string, unknown>) => {
  //   if (!id) return;
  //   try {
  //     const hearingDate = new Date(hearing.start_at as string);
  //     const deadlineDate = new Date(hearingDate);
  //     deadlineDate.setDate(deadlineDate.getDate() - 7);
  //     await databases.createDocument(
  //       DATABASE_ID,
  //       COLLECTIONS.deadlines,
  //       ID.unique(),
  //       {
  //         matter_id: String(id),
  //         title: `Prepare for ${hearing.hearing_type || 'Court Appearance'}`,
  //         source: 'CourtOrder',
  //         due_at: deadlineDate.toISOString(),
  //         description: `Prepare documents and materials for ${hearing.hearing_type} scheduled on ${hearingDate.toLocaleDateString()}`,
  //         status: 'Pending',
  //         priority: 'High'
  //       }
  //     );
  //   } catch (error) {
  //     console.error('Error creating hearing deadline:', error);
  //   }
  // };

  // Duplicate function removed

  const fetchDocuments = async () => {
    if (!id) return;
    try {
      const list = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.documents,
        [Query.equal('matter_id', String(id))]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
        // Normalize for UI safety
        subject: d.subject || `${d.channel} ${d.direction}`,
        body: d.body,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // const createTask = async () => {
  //   if (!id) return;
  //   try {
  //     const payload: Record<string, unknown> = {
  //       matter_id: String(id),
  //       title: 'New Task',
  //       description: '',
  //       status: 'pending',
  //       priority: 'medium',
  //       due_date: new Date().toISOString().split('T')[0],
  //       assigned_to: ''
  //     };
  //     
  //     await databases.createDocument(
  //       DATABASE_ID,
  //       COLLECTIONS.tasks,
  //       ID.unique(),
  //       payload
  //     );
  //     
  //     fetchTasks();
  //   } catch (error) {
  //     console.error('Error creating task:', error);
  //   }
  // };

  // const updateTask = async (taskId: number, updates: Record<string, unknown>) => {
  //   try {
  //     await databases.updateDocument(
  //       DATABASE_ID,
  //       COLLECTIONS.tasks,
  //       taskId.toString(),
  //       updates
  //     );
  //     fetchTasks();
  //   } catch (error) {
  //     console.error('Error updating task:', error);
  //   }
  // };

  // const deleteTask = async (taskId: number) => {
  //   if (!confirm('Are you sure you want to delete this task?')) return;
  //   try {
  //     await databases.deleteDocument(
  //       DATABASE_ID,
  //       COLLECTIONS.tasks,
  //       String(taskId)
  //     );
  //     await fetchTasks();
  //   } catch (error) {
  //     console.error('Error deleting task:', error);
  //   }
  // };

  // Commented out unused functions
  // const deleteDocument = async (docId: string | number) => {
  //   if (!confirm('Are you sure you want to delete this document?')) return;
  //   
  //   try {
  //     await databases.deleteDocument(
  //       DATABASE_ID,
  //       COLLECTIONS.documents,
  //       String(docId)
  //     );
  //     setDocuments(documents.filter(doc => String(doc.id ?? doc.$id) !== String(docId)));
  //   } catch (error) {
  //     console.error('Error deleting document:', error);
  //   }
  // };

  // const openPreview = (document: Record<string, unknown>) => {
  //   setPreviewDocument(document as Document);
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

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.matters,
        id,
        {
          case_data: JSON.stringify(criminalData || {}),
        }
      );
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      const message = (err && typeof err === 'object' && 'message' in err) ? String((err as Error).message) : 'Failed to save changes';
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('unauthorized')) {
        setSaveError('You do not have permission to update this matter. Ask an admin to grant update access or create a new matter yourself.');
      } else if (message.toLowerCase().includes('attribute') || message.toLowerCase().includes('case_data')) {
        setSaveError('The matter is missing the "case_data" field in Appwrite. Run the setup script or add this attribute in the console.');
      } else {
        setSaveError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

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
          <button
            type="button"
            onClick={() => navigate('/matters')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-200 hover:text-white"
            aria-label="Back to matters"
            title="Back to matters"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
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
          {saveSuccess && (
            <span className="text-xs text-green-300">Saved</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white ${isSaving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
          >
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
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
          {saveError && (
            <div className="mb-4 p-3 rounded border border-red-400 text-red-200 bg-red-900/20">
              {saveError}
            </div>
          )}
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
                        <label className="block text-xs font-medium text-blue-200 mb-1">Disposition</label>
                        <input
                          type="text"
                          title="Disposition"
                          placeholder="Enter disposition"
                          aria-label="Disposition"
                          className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                          value={(criminalData.disposition as string) || ''}
                          onChange={(e) => setCriminalData({...criminalData, disposition: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-200 mb-1">Jurisdiction</label>
                        <input
                          type="text"
                          value={(criminalData.jurisdiction as string) || ''}
                          onChange={(e) => setCriminalData({...criminalData, jurisdiction: e.target.value})}
                          className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                          title="Jurisdiction"
                          placeholder="Enter jurisdiction"
                          aria-label="Jurisdiction"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-200 mb-1">Arrest Date</label>
                        <input
                          type="date"
                          value={(criminalData.arrest_date as string) || ''}
                          onChange={(e) => setCriminalData({...criminalData, arrest_date: e.target.value})}
                          className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                          title="Arrest Date"
                          aria-label="Arrest Date"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-blue-200 mb-1">Charges</label>
                        <input
                          type="text"
                          title="Charges"
                          placeholder="Enter charges"
                          aria-label="Charges"
                          className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
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
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg cursor-pointer" onClick={() => { setPreviewDocument(doc); setShowPreview(true); }}>
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
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {communications.map((comm: any) => (
                    <div key={comm.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-white">{comm.subject}</h5>
                          <p className="text-sm text-blue-200 mt-1">{comm.body}</p>
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

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Timeline</h4>
              {timelineEvents.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  <p>No timeline events yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timelineEvents.map((ev, idx) => (
                    <div key={String((ev.id as string) ?? idx)} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white">{String(ev.title ?? '')}</p>
                          {ev.description && (
                            <p className="text-xs text-blue-200 mt-1">{String(ev.description)}</p>
                          )}
                        </div>
                        {ev.date && (
                          <span className="text-xs text-blue-300">{new Date(String(ev.date)).toLocaleDateString()}</span>
                        )}
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
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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

          {/* Bottom action bar */}
          <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate('/matters')}
              className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Matters
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white ${isSaving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {showPreview && previewDocument && (
        <DocumentPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          document={previewDocument as any}
        />
      )}
    </div>
  );
}
