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
  Plus,
  Eye,
  Download,
  Trash2,
  MessageCircle,
  Upload,
  X
} from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';

export default function MatterDetail() {
  const { id } = useParams();
  const [matter, setMatter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [criminalData, setCriminalData] = useState<any>({});
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [billingStats, setBillingStats] = useState<any>({});
  const [documents, setDocuments] = useState<any[]>([]);
  const [communications, setCommunications] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [hearings, setHearings] = useState<any[]>([]);
  const [showHearingForm, setShowHearingForm] = useState(false);
  const [editingHearing, setEditingHearing] = useState<any>(null);
  const [hearingForm, setHearingForm] = useState({
    hearing_type: '',
    start_at: '',
    end_at: '',
    courtroom: '',
    judge_or_alj: '',
    notes: '',
    is_ssa_hearing: false,
    court_id: null,
  });
  const [savingHearing, setSavingHearing] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_at: '',
    priority: 'Medium',
    assignee_ids: [],
    status: 'Open'
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
      const response = await fetch(`/api/matters/${id}`, {
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`Failed to fetch matter: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Matter data received:', data);
      
      setMatter(data);
      if (data.case_data) {
        setCriminalData(data.case_data);
      }
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
      const [
        timeEntriesRes,
        documentsRes,
        hearingsRes,
        deadlinesRes,
        communicationsRes
      ] = await Promise.all([
        fetch(`/api/time-entries?matter_id=${id}`, { credentials: 'include' }),
        fetch(`/api/documents?matter_id=${id}`, { credentials: 'include' }),
        fetch(`/api/hearings?matter_id=${id}`, { credentials: 'include' }),
        fetch(`/api/deadlines?matter_id=${id}`, { credentials: 'include' }),
        fetch(`/api/communications?matter_id=${id}`, { credentials: 'include' })
      ]);

      const events = [];

      // Add matter creation event
      if (matter) {
        events.push({
          id: `matter-${matter.id}`,
          type: 'matter_created',
          title: 'Matter Opened',
          description: `${matter.title} was opened`,
          date: matter.opened_at || matter.created_at,
          icon: FileText,
          color: 'blue'
        });
      }

      // Add time entries
      if (timeEntriesRes.ok) {
        const timeData = await timeEntriesRes.json();
        timeData.forEach((entry: any) => {
          events.push({
            id: `time-${entry.id}`,
            type: 'time_entry',
            title: 'Time Entry',
            description: entry.description,
            date: entry.entry_date,
            icon: Clock,
            color: 'green',
            meta: `${entry.hours}h @ $${entry.rate}/hr = $${(entry.hours * entry.rate).toFixed(2)}`
          });
        });
      }

      // Add documents
      if (documentsRes.ok) {
        const docData = await documentsRes.json();
        docData.forEach((doc: any) => {
          events.push({
            id: `doc-${doc.id}`,
            type: 'document',
            title: 'Document Created',
            description: doc.title,
            date: doc.created_at,
            icon: FileText,
            color: 'purple',
            meta: `Version ${doc.version} • ${doc.status}`
          });
        });
      }

      // Add hearings
      if (hearingsRes.ok) {
        const hearingData = await hearingsRes.json();
        hearingData.forEach((hearing: any) => {
          events.push({
            id: `hearing-${hearing.id}`,
            type: 'hearing',
            title: hearing.hearing_type || 'Hearing',
            description: `${hearing.courtroom ? `Courtroom ${hearing.courtroom}` : ''} ${hearing.judge_or_alj ? `- ${hearing.judge_or_alj}` : ''}`.trim(),
            date: hearing.start_at,
            icon: Calendar,
            color: 'red',
            meta: hearing.court_name
          });
        });
      }

      // Add deadlines
      if (deadlinesRes.ok) {
        const deadlineData = await deadlinesRes.json();
        deadlineData.forEach((deadline: any) => {
          events.push({
            id: `deadline-${deadline.id}`,
            type: 'deadline',
            title: deadline.title,
            description: `${deadline.source} deadline`,
            date: deadline.due_at,
            icon: AlertCircle,
            color: deadline.status === 'Completed' ? 'green' : 'orange',
            meta: deadline.status
          });
        });
      }

      // Add communications
      if (communicationsRes.ok) {
        const commData = await communicationsRes.json();
        commData.forEach((comm: any) => {
          events.push({
            id: `comm-${comm.id}`,
            type: 'communication',
            title: `${comm.channel} ${comm.direction}`,
            description: comm.body?.substring(0, 100) + (comm.body?.length > 100 ? '...' : ''),
            date: comm.sent_at || comm.created_at,
            icon: comm.channel === 'Phone' ? Phone : Mail,
            color: comm.direction === 'Inbound' ? 'blue' : 'indigo'
          });
        });
      }

      // Sort events by date (newest first)
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTimelineEvents(events);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
    }
  };

  const fetchBillingData = async () => {
    if (!id) return;
    
    try {
      const [balanceRes, timeRes, invoicesRes, paymentsRes] = await Promise.all([
        fetch(`/api/matters/${id}/balance`, { credentials: 'include' }),
        fetch(`/api/time-entries?matter_id=${id}`, { credentials: 'include' }),
        fetch(`/api/invoices?matter_id=${id}`, { credentials: 'include' }),
        fetch(`/api/payments?matter_id=${id}`, { credentials: 'include' })
      ]);

      if (timeRes.ok) {
        const timeData = await timeRes.json();
        setTimeEntries(timeData);
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData);
      }

      // Get balance data from new API endpoint
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBillingStats({
          totalTime: timeEntries.reduce((sum, entry) => sum + (entry.hours * entry.rate), 0),
          totalInvoiced: balanceData.total_invoiced,
          totalPaid: balanceData.total_paid,
          outstanding: balanceData.current_balance,
          unbilledTime: balanceData.unbilled_amount,
          totalAmountDue: balanceData.total_amount_due
        });
      } else {
        // Fallback to old calculation method
        const totalTime = timeEntries.reduce((sum, entry) => sum + (entry.hours * entry.rate), 0);
        const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
        const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const outstanding = totalInvoiced - totalPaid;

        setBillingStats({
          totalTime,
          totalInvoiced,
          totalPaid,
          outstanding,
          unbilledTime: totalTime - totalInvoiced
        });
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
    }
  };

  const saveCriminalData = async () => {
    try {
      const response = await fetch(`/api/matters/${id}/criminal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(criminalData),
      });
      if (response.ok) {
        setIsEditing(false);
        // Show success message
      }
    } catch (error) {
      console.error('Error updating criminal case data:', error);
    }
  };

  const fetchHearings = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/hearings?matter_id=${id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setHearings(data);
      }
    } catch (error) {
      console.error('Error fetching hearings:', error);
    }
  };

  const createHearing = async () => {
    if (!id) return;
    
    setSavingHearing(true);
    try {
      const response = await fetch('/api/hearings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...hearingForm,
          matter_id: parseInt(id),
          start_at: hearingForm.start_at ? new Date(hearingForm.start_at).toISOString() : null,
          end_at: hearingForm.end_at ? new Date(hearingForm.end_at).toISOString() : null,
          is_ssa_hearing: hearingForm.is_ssa_hearing || matter?.practice_area === 'SSD',
        }),
      });
      
      if (response.ok) {
        await fetchHearings();
        setShowHearingForm(false);
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
        
        // Auto-create deadline if enabled
        const hearing = await response.json();
        if (hearing.start_at && id) {
          await createHearingDeadline(hearing);
        }
      }
    } catch (error) {
      console.error('Error creating hearing:', error);
    } finally {
      setSavingHearing(false);
    }
  };

  const updateHearing = async (hearingId: number, updates: any) => {
    try {
      const response = await fetch(`/api/hearings/${hearingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...updates,
          start_at: updates.start_at ? new Date(updates.start_at).toISOString() : null,
          end_at: updates.end_at ? new Date(updates.end_at).toISOString() : null,
        }),
      });
      
      if (response.ok) {
        await fetchHearings();
        setEditingHearing(null);
      }
    } catch (error) {
      console.error('Error updating hearing:', error);
    }
  };

  const deleteHearing = async (hearingId: number) => {
    if (!confirm('Are you sure you want to delete this hearing? This will also remove any related deadlines.')) return;
    
    try {
      const response = await fetch(`/api/hearings/${hearingId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        await fetchHearings();
      }
    } catch (error) {
      console.error('Error deleting hearing:', error);
    }
  };

  const createHearingDeadline = async (hearing: any) => {
    if (!id) return;
    
    try {
      const hearingDate = new Date(hearing.start_at);
      const deadlineDate = new Date(hearingDate);
      deadlineDate.setDate(deadlineDate.getDate() - 7); // Default to 7 days before hearing

      await fetch('/api/deadlines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          matter_id: parseInt(id),
          title: `Prepare for ${hearing.hearing_type || 'Court Appearance'}`,
          source: 'CourtOrder',
          due_at: deadlineDate.toISOString(),
          trigger_event_id: hearing.id,
        }),
      });
    } catch (error) {
      console.error('Error creating hearing deadline:', error);
    }
  };

  const fetchDocuments = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/documents?matter_id=${id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchCommunications = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/communications?matter_id=${id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCommunications(data);
      }
    } catch (error) {
      console.error('Error fetching communications:', error);
    }
  };

  const fetchTasks = async () => {
    if (!id) return;
    
    try {
      const response = await fetch(`/api/tasks?matter_id=${id}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createTask = async () => {
    if (!id) return;
    
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...taskForm,
          matter_id: parseInt(id)
        }),
      });
      
      if (response.ok) {
        await fetchTasks();
        setShowTaskForm(false);
        setTaskForm({
          title: '',
          description: '',
          due_at: '',
          priority: 'Medium',
          assignee_ids: [],
          status: 'Open'
        });
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (taskId: number, updates: any) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        await fetchTasks();
        setEditingTask(null);
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const completeTask = async (taskId: number) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const deleteTask = async (taskId: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const deleteDocument = async (docId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== docId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const openPreview = (document: any) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Final': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Email': return Mail;
      case 'Phone': return Phone;
      case 'SMS': return MessageCircle;
      case 'Portal': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'Email': return 'bg-blue-100 text-blue-600';
      case 'Phone': return 'bg-green-100 text-green-600';
      case 'SMS': return 'bg-purple-100 text-purple-600';
      case 'Portal': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'Inbound' 
      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
      : 'bg-green-50 border-l-4 border-l-green-500';
  };

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
                            value={criminalData.case_number || ''}
                            onChange={(e) => setCriminalData({...criminalData, case_number: e.target.value})}
                            className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
                          />
                        ) : (
                          <p className="text-sm text-white">{criminalData.case_number || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Jurisdiction</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={criminalData.jurisdiction || ''}
                            onChange={(e) => setCriminalData({...criminalData, jurisdiction: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">{criminalData.jurisdiction || 'Not specified'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Arrest Date</label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={criminalData.arrest_date || ''}
                            onChange={(e) => setCriminalData({...criminalData, arrest_date: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="text-sm text-gray-900">
                            {criminalData.arrest_date ? new Date(criminalData.arrest_date).toLocaleDateString() : 'Not specified'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Charges & Statutes</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Charges</label>
                        {isEditing ? (
                          <textarea
                            value={criminalData.charges ? JSON.parse(criminalData.charges).join('\n') : ''}
                            onChange={(e) => setCriminalData({
                              ...criminalData, 
                              charges: JSON.stringify(e.target.value.split('\n').filter(line => line.trim()))
                            })}
                            rows={3}
                            placeholder="Enter each charge on a new line"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="space-y-1">
                            {criminalData.charges ? JSON.parse(criminalData.charges).map((charge: string, index: number) => (
                              <p key={index} className="text-sm text-gray-900">• {charge}</p>
                            )) : <p className="text-sm text-gray-500">No charges listed</p>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {timelineEvents.length > 0 ? (
                <div className="flow-root">
                  <ul className="space-y-6">
                    {timelineEvents.map((event, index) => {
                      const Icon = event.icon;
                      const colorClasses = {
                        blue: 'bg-blue-500',
                        green: 'bg-green-500',
                        purple: 'bg-purple-500',
                        red: 'bg-red-500',
                        orange: 'bg-orange-500',
                        indigo: 'bg-indigo-500'
                      };
                      
                      return (
                        <li key={event.id} className="relative">
                          {index < timelineEvents.length - 1 && (
                            <div className="absolute left-6 top-12 -ml-px h-full w-0.5 bg-gray-200" />
                          )}
                          <div className="flex items-start space-x-4">
                            <div className={`relative flex h-12 w-12 items-center justify-center rounded-full ${colorClasses[event.color as keyof typeof colorClasses]} shadow-sm`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-sm font-semibold text-gray-900">{event.title}</h4>
                                  <time className="text-xs text-gray-500">
                                    {new Date(event.date).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </time>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                                {event.meta && (
                                  <p className="text-xs text-gray-500 font-medium">{event.meta}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No timeline events</h3>
                  <p className="text-sm text-gray-500">Activity on this matter will appear here.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Documents Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">
                  Documents ({documents.length})
                </h4>
                <div className="flex space-x-3">
                  <Link
                    to="/documents/upload"
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </Link>
                  <Link
                    to="/documents/generate"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Generate
                  </Link>
                </div>
              </div>

              {/* Documents List */}
              {documents.length > 0 ? (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{doc.title}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(doc.created_at).toLocaleDateString()}
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                              {doc.status}
                            </span>
                            {doc.version > 1 && (
                              <span className="text-xs text-gray-500">v{doc.version}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openPreview(doc)}
                          className="p-2 text-gray-400 hover:text-gray-600"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {doc.file_url && (
                          <button 
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="p-2 text-gray-400 hover:text-gray-600"
                            title="Download Document"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteDocument(doc.id)}
                          className="p-2 text-gray-400 hover:text-red-600"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by generating a document or uploading an existing one.
                  </p>
                  <div className="mt-6 flex justify-center space-x-3">
                    <Link
                      to="/documents/upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Link>
                    <Link
                      to="/documents/generate"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Document
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Billing Summary */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-xs font-medium text-blue-600">Total Time</p>
                      <p className="text-lg font-bold text-blue-900">${billingStats.totalTime?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-xs font-medium text-green-600">Invoiced</p>
                      <p className="text-lg font-bold text-green-900">${billingStats.totalInvoiced?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-xs font-medium text-purple-600">Paid</p>
                      <p className="text-lg font-bold text-purple-900">${billingStats.totalPaid?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="text-xs font-medium text-orange-600">Outstanding</p>
                      <p className="text-lg font-bold text-orange-900">${billingStats.outstanding?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <div>
                      <p className="text-xs font-medium text-red-600">Total Due</p>
                      <p className="text-lg font-bold text-red-900">${billingStats.totalAmountDue?.toLocaleString() || '0'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Actions */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Billing Activity</h4>
                <div className="flex space-x-3">
                  <Link
                    to="/billing/time/new" 
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Log Time
                  </Link>
                  <Link
                    to="/billing/invoice/new"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Link>
                </div>
              </div>

              {/* Time Entries */}
              {timeEntries.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <h5 className="text-sm font-medium text-gray-900">Time Entries</h5>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {timeEntries.map((entry) => (
                      <div key={entry.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(entry.entry_date).toLocaleDateString()} • {entry.hours}h @ ${entry.rate}/hr
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">${(entry.hours * entry.rate).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {invoices.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <h5 className="text-sm font-medium text-gray-900">Invoices</h5>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {invoices.map((invoice) => {
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
                              <div className="flex items-center space-x-3">
                                <p className="text-sm font-medium text-gray-900">Invoice #{invoice.invoice_number}</p>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status as keyof typeof statusColors]}`}>
                                  {invoice.status}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500">
                                Issued: {new Date(invoice.issue_date).toLocaleDateString()} • 
                                Due: {new Date(invoice.due_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">${invoice.total.toFixed(2)}</p>
                              </div>
                              <div className="flex space-x-1">
                                <Link to={`/billing/invoice/${invoice.id}`} className="p-1 text-gray-400 hover:text-gray-600">
                                  <Eye className="h-4 w-4" />
                                </Link>
                                <button 
                                  onClick={() => alert('Download invoice functionality would be implemented here')}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payments */}
              {payments.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                    <h5 className="text-sm font-medium text-gray-900">Payments</h5>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <div key={payment.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Payment for Invoice #{payment.invoice_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(payment.received_at).toLocaleDateString()} • {payment.payment_method}
                              {payment.reference && ` • Ref: ${payment.reference}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">${payment.amount.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {timeEntries.length === 0 && invoices.length === 0 && payments.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No billing activity</h3>
                  <p className="text-sm text-gray-500 mb-4">Start by logging time entries for this matter.</p>
                  <Link
                    to="/billing/time/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Log Time Entry
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="space-y-6">
              {/* Communications Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">
                  Communications ({communications.length})
                </h4>
                <Link
                  to="/communications"
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Communication
                </Link>
              </div>

              {/* Communications List */}
              {communications.length > 0 ? (
                <div className="space-y-4">
                  {communications.slice(0, 10).map((comm) => {
                    const ChannelIcon = getChannelIcon(comm.channel);
                    
                    return (
                      <div
                        key={comm.id}
                        className={`p-4 rounded-lg border hover:bg-gray-50 ${getDirectionColor(comm.direction)}`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getChannelColor(comm.channel)}`}>
                            <ChannelIcon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  comm.direction === 'Inbound' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {comm.direction}
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {comm.direction === 'Inbound' ? comm.from_address : comm.to_address}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {new Date(comm.sent_at || comm.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            {comm.body && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {comm.body}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {communications.length > 10 && (
                    <div className="text-center pt-4">
                      <Link
                        to="/communications"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View all {communications.length} communications →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No communications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start tracking communications for this matter.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/communications"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Communication
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-6">
              {/* Tasks Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <CheckSquare className="mr-2 h-5 w-5" />
                  Tasks ({tasks.length})
                </h4>
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Task
                </button>
              </div>

              {/* Task Creation Form */}
              {showTaskForm && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-md font-semibold text-gray-900">Create New Task</h5>
                    <button
                      onClick={() => {
                        setShowTaskForm(false);
                        setTaskForm({
                          title: '',
                          description: '',
                          due_at: '',
                          priority: 'Medium',
                          assignee_ids: [],
                          status: 'Open'
                        });
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                        <input
                          type="text"
                          value={taskForm.title}
                          onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter task title"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          value={taskForm.priority}
                          onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                          <option value="Urgent">Urgent</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={taskForm.description}
                        onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter task description (optional)"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Due Date (Optional)</label>
                      <input
                        type="datetime-local"
                        value={taskForm.due_at}
                        onChange={(e) => setTaskForm({ ...taskForm, due_at: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowTaskForm(false);
                          setTaskForm({
                            title: '',
                            description: '',
                            due_at: '',
                            priority: 'Medium',
                            assignee_ids: [],
                            status: 'Open'
                          });
                        }}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createTask}
                        disabled={!taskForm.title}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Task
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tasks List */}
              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map((task) => {
                    const priorityColors = {
                      Low: 'bg-gray-100 text-gray-800',
                      Medium: 'bg-blue-100 text-blue-800',
                      High: 'bg-orange-100 text-orange-800',
                      Urgent: 'bg-red-100 text-red-800'
                    };

                    const statusColors = {
                      Open: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                      InProgress: 'bg-blue-100 text-blue-800 border-blue-200',
                      Completed: 'bg-green-100 text-green-800 border-green-200'
                    };

                    return (
                      <div key={task.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        task.status === 'Completed' ? 'opacity-75' : ''
                      } ${statusColors[task.status as keyof typeof statusColors]}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className={`text-sm font-medium ${
                                task.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'
                              }`}>
                                {task.title}
                              </h3>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                priorityColors[task.priority as keyof typeof priorityColors]
                              }`}>
                                {task.priority}
                              </span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                statusColors[task.status as keyof typeof statusColors]
                              }`}>
                                {task.status === 'InProgress' ? 'In Progress' : task.status}
                              </span>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Created: {new Date(task.created_at).toLocaleDateString()}
                              </div>
                              {task.due_at && (
                                <div className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Due: {new Date(task.due_at).toLocaleDateString()}
                                  {task.days_until_due !== null && (
                                    <span className={`ml-1 ${
                                      task.days_until_due < 0 ? 'text-red-600 font-medium' : 
                                      task.days_until_due <= 3 ? 'text-orange-600 font-medium' : ''
                                    }`}>
                                      ({task.days_until_due < 0 ? `${Math.abs(task.days_until_due)} days overdue` : 
                                        task.days_until_due === 0 ? 'Due today' : 
                                        `${task.days_until_due} days remaining`})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {task.status !== 'Completed' && (
                              <>
                                <button
                                  onClick={() => setEditingTask(task)}
                                  className="p-1 text-gray-400 hover:text-blue-600"
                                  title="Edit Task"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => completeTask(task.id)}
                                  className="p-1 text-gray-400 hover:text-green-600"
                                  title="Mark Complete"
                                >
                                  <CheckSquare className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete Task"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No tasks yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Keep track of action items and to-dos for this matter.</p>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Task
                  </button>
                </div>
              )}

              {/* Edit Task Modal */}
              {editingTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-md">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Edit Task</h3>
                      <button
                        onClick={() => setEditingTask(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                        <textarea
                          value={editingTask.description || ''}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={editingTask.status}
                            onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Open">Open</option>
                            <option value="InProgress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                          <select
                            value={editingTask.priority}
                            onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                        <input
                          type="datetime-local"
                          value={editingTask.due_at ? new Date(editingTask.due_at).toISOString().slice(0, 16) : ''}
                          onChange={(e) => setEditingTask({ ...editingTask, due_at: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setEditingTask(null)}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => updateTask(editingTask.id, editingTask)}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Court Settings Header */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-bright flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Court Appearances & Settings ({hearings.length})
                </h4>
                <button
                  onClick={() => setShowHearingForm(true)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule Hearing
                </button>
              </div>

              {/* Add Hearing Form */}
              {showHearingForm && (
                <div className="bg-white/8 backdrop-blur-xl border border-white/10 rounded-lg p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="text-md font-semibold text-bright">Schedule New Court Appearance</h5>
                    <button
                      onClick={() => {
                        setShowHearingForm(false);
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
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-bright-secondary mb-2">Hearing Type *</label>
                        <input
                          type="text"
                          value={hearingForm.hearing_type}
                          onChange={(e) => setHearingForm({ ...hearingForm, hearing_type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Arraignment, Motion Hearing, Trial"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Start Date/Time *</label>
                        <input
                          type="datetime-local"
                          value={hearingForm.start_at}
                          onChange={(e) => setHearingForm({ ...hearingForm, start_at: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">End Date/Time</label>
                        <input
                          type="datetime-local"
                          value={hearingForm.end_at}
                          onChange={(e) => setHearingForm({ ...hearingForm, end_at: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Courtroom</label>
                        <input
                          type="text"
                          value={hearingForm.courtroom}
                          onChange={(e) => setHearingForm({ ...hearingForm, courtroom: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., 3A, Main Courtroom"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {matter?.practice_area === 'SSD' || hearingForm.is_ssa_hearing ? 'ALJ' : 'Judge'}
                      </label>
                      <input
                        type="text"
                        value={hearingForm.judge_or_alj}
                        onChange={(e) => setHearingForm({ ...hearingForm, judge_or_alj: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={matter?.practice_area === 'SSD' || hearingForm.is_ssa_hearing ? 'Administrative Law Judge' : 'Judge Name'}
                      />
                    </div>

                    {matter?.practice_area === 'SSD' && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_ssa_hearing"
                          checked={hearingForm.is_ssa_hearing || matter?.practice_area === 'SSD'}
                          onChange={(e) => setHearingForm({ ...hearingForm, is_ssa_hearing: e.target.checked })}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="is_ssa_hearing" className="text-sm text-gray-700">
                          This is an SSA hearing
                        </label>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        value={hearingForm.notes}
                        onChange={(e) => setHearingForm({ ...hearingForm, notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Additional notes about the hearing..."
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowHearingForm(false);
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
                        }}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createHearing}
                        disabled={!hearingForm.hearing_type || !hearingForm.start_at || savingHearing}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingHearing ? (
                          <>
                            <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Scheduling...
                          </>
                        ) : (
                          'Schedule Hearing'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hearings List */}
              {hearings.length > 0 ? (
                <div className="space-y-4">
                  {hearings.map((hearing) => {
                    const hearingDate = new Date(hearing.start_at);
                    const isUpcoming = hearingDate > new Date();
                    const daysUntil = Math.ceil((hearingDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div key={hearing.id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        isUpcoming ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {hearing.hearing_type || 'Court Hearing'}
                              </h3>
                              {isUpcoming && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Upcoming
                                </span>
                              )}
                              {hearing.is_ssa_hearing && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  SSA Hearing
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <div>
                                  <p className="font-medium">{hearingDate.toLocaleDateString()}</p>
                                  <p>{hearingDate.toLocaleTimeString()}</p>
                                </div>
                              </div>
                              
                              {hearing.courtroom && (
                                <div>
                                  <p className="font-medium">Courtroom</p>
                                  <p>{hearing.courtroom}</p>
                                </div>
                              )}
                              
                              {hearing.judge_or_alj && (
                                <div>
                                  <p className="font-medium">{hearing.is_ssa_hearing ? 'ALJ' : 'Judge'}</p>
                                  <p>{hearing.judge_or_alj}</p>
                                </div>
                              )}
                            </div>

                            {isUpcoming && (
                              <div className="flex items-center text-sm">
                                <AlertCircle className="w-4 h-4 mr-1 text-orange-500" />
                                <span className={`font-medium ${
                                  daysUntil <= 1 ? 'text-red-600' : 
                                  daysUntil <= 7 ? 'text-orange-600' : 'text-green-600'
                                }`}>
                                  {daysUntil === 0 ? 'Today' : 
                                   daysUntil === 1 ? 'Tomorrow' : 
                                   `${daysUntil} days away`}
                                </span>
                              </div>
                            )}
                            
                            {hearing.notes && (
                              <p className="text-sm text-gray-600 mt-2">{hearing.notes}</p>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => setEditingHearing(hearing)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Edit Hearing"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteHearing(hearing.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete Hearing"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-sm font-medium text-gray-900 mb-2">No court appearances scheduled</h3>
                  <p className="text-sm text-gray-500 mb-4">Schedule court hearings and appearances for this matter.</p>
                  <button
                    onClick={() => setShowHearingForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Schedule First Hearing
                  </button>
                </div>
              )}

              {/* Edit Hearing Modal */}
              {editingHearing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">Edit Court Appearance</h3>
                      <button
                        onClick={() => setEditingHearing(null)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Hearing Type</label>
                          <input
                            type="text"
                            value={editingHearing.hearing_type || ''}
                            onChange={(e) => setEditingHearing({ ...editingHearing, hearing_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Start Date/Time</label>
                          <input
                            type="datetime-local"
                            value={editingHearing.start_at ? new Date(editingHearing.start_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setEditingHearing({ ...editingHearing, start_at: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">End Date/Time</label>
                          <input
                            type="datetime-local"
                            value={editingHearing.end_at ? new Date(editingHearing.end_at).toISOString().slice(0, 16) : ''}
                            onChange={(e) => setEditingHearing({ ...editingHearing, end_at: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Courtroom</label>
                          <input
                            type="text"
                            value={editingHearing.courtroom || ''}
                            onChange={(e) => setEditingHearing({ ...editingHearing, courtroom: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {editingHearing.is_ssa_hearing ? 'ALJ' : 'Judge'}
                        </label>
                        <input
                          type="text"
                          value={editingHearing.judge_or_alj || ''}
                          onChange={(e) => setEditingHearing({ ...editingHearing, judge_or_alj: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                        <textarea
                          value={editingHearing.notes || ''}
                          onChange={(e) => setEditingHearing({ ...editingHearing, notes: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {matter?.practice_area === 'SSD' && (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="edit_is_ssa_hearing"
                            checked={editingHearing.is_ssa_hearing}
                            onChange={(e) => setEditingHearing({ ...editingHearing, is_ssa_hearing: e.target.checked })}
                            className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="edit_is_ssa_hearing" className="text-sm text-gray-700">
                            This is an SSA hearing
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => setEditingHearing(null)}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => updateHearing(editingHearing.id, editingHearing)}
                        className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h6 className="text-sm font-medium text-blue-900">Court Setting Benefits</h6>
                    <p className="text-sm text-blue-700 mt-1">
                      When you schedule court appearances here, the system will automatically:
                    </p>
                    <ul className="text-sm text-blue-700 mt-2 ml-4 space-y-1">
                      <li>• Create preparation deadlines 7 days before the hearing</li>
                      <li>• Send reminder notifications to all relevant parties</li>
                      <li>• Add the appearance to your calendar timeline</li>
                      <li>• Track hearing outcomes and follow-up actions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreview
        isOpen={showPreview}
        onClose={closePreview}
        document={previewDocument}
      />
    </div>
  );
}
