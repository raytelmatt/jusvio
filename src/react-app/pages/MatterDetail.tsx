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
  Phone,
  Trash2,
  Play,
  CheckCircle,
  Plus
} from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/react-app/lib/backend';
import { Matter, Document, Communication, Task } from '@/shared/types';
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
  const [tasks, setTasks] = useState<Task[]>([]);
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
  const [invoices, setInvoices] = useState<Record<string, unknown>[]>([]);
  const [timeEntries, setTimeEntries] = useState<Record<string, unknown>[]>([]);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Record<string, unknown> | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    description: '',
    line_items: [] as Array<{ description: string; quantity: number; rate: number; amount: number }>,
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    default_rate: 150,
    tax_rate: 0,
    discount_rate: 0,
  });

  const [invoiceLineItems, setInvoiceLineItems] = useState<Array<{ id: string; description: string; quantity: number; rate: number; amount: number }>>([]);

  // Invoice line item management functions
  const addTimeEntryToInvoice = (timeEntry: Record<string, unknown>) => {
    const newLineItem = {
      id: `time-${timeEntry.id}`,
      description: `${new Date(timeEntry.entry_date as string).toLocaleDateString()} - ${timeEntry.description}`,
      quantity: Number(timeEntry.hours || 0),
      rate: Number(timeEntry.rate || 150),
      amount: Number(timeEntry.hours || 0) * Number(timeEntry.rate || 150),
    };
    setInvoiceLineItems([...invoiceLineItems, newLineItem]);
  };

  const addCustomLineItem = () => {
    const newLineItem = {
      id: `custom-${Date.now()}`,
      description: '',
      quantity: 1,
      rate: invoiceForm.default_rate,
      amount: invoiceForm.default_rate,
    };
    setInvoiceLineItems([...invoiceLineItems, newLineItem]);
  };

  const updateInvoiceLineItem = (id: string, field: keyof typeof invoiceLineItems[0], value: string | number) => {
    setInvoiceLineItems(invoiceLineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeInvoiceLineItem = (id: string) => {
    setInvoiceLineItems(invoiceLineItems.filter(item => item.id !== id));
  };

  const calculateInvoiceSubtotal = () => {
    return invoiceLineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateInvoiceTax = () => {
    return calculateInvoiceSubtotal() * (invoiceForm.tax_rate / 100);
  };

  const calculateInvoiceDiscount = () => {
    return calculateInvoiceSubtotal() * (invoiceForm.discount_rate / 100);
  };

  const calculateInvoiceTotal = () => {
    const subtotal = calculateInvoiceSubtotal();
    const tax = calculateInvoiceTax();
    const discount = calculateInvoiceDiscount();
    return subtotal + tax - discount;
  };

  // Task management state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Record<string, unknown> | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    status: 'Open' as 'Open' | 'InProgress' | 'Completed',
  });
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

  const [isTaskLoading, setIsTaskLoading] = useState(false);

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
      // Prefer case_data on matters; fallback to matters_meta if needed
      let rawCaseData = (matter.case_data as string | undefined) ?? '';
      if (!rawCaseData) {
        try {
          const meta = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.mattersMeta,
            [Query.equal('matter_id', id)]
          );
          rawCaseData = (meta.documents?.[0]?.case_data as string | undefined) ?? '';
        } catch {
          // ignore fallback errors
        }
      }
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
      const [timeEntriesData, invoicesData, paymentsData] = await Promise.all([
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
          []  // Payments don't have matter_id directly, they're linked to invoices
        ),
      ]);

      // Process invoices with proper numeric fields
      const processedInvoices = invoicesData.documents?.map((inv: Record<string, unknown>) => ({
        ...inv,
        amount: Number(inv.amount ?? inv.total ?? 0),
        total: Number(inv.total ?? inv.amount ?? 0),
        subtotal: Number(inv.subtotal ?? inv.total ?? inv.amount ?? 0),
      })) || [];

      // Filter payments for this matter's invoices
      const invoiceIds = processedInvoices.map((inv: Record<string, unknown>) => inv.$id || inv.id);
      const relevantPayments = paymentsData.documents?.filter((payment: Record<string, unknown>) => 
        invoiceIds.includes(payment.invoice_id)
      ) || [];

      setTimeEntries(timeEntriesData.documents || []);
      setInvoices(processedInvoices);
      setPayments(relevantPayments);
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
      const rows = (list.documents || []).map((d: Record<string, unknown>) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      })) as unknown as Task[];
      setTasks(rows);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createTask = async () => {
    if (!id) return;
    try {
      setIsTaskLoading(true);
      const payload: Record<string, unknown> = {
        matter_id: String(id),
        title: taskForm.title,
        description: taskForm.description || null,
        status: taskForm.status,
        due_at: taskForm.due_at || null
      };
      
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.tasks,
        'unique()',
        payload
      );
      
      await fetchTasks();
      setShowTaskModal(false);
      resetTaskForm();
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error creating task:', error);
      setSaveError('Failed to create task. Please try again.');
    } finally {
      setIsTaskLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      setIsTaskLoading(true);
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.tasks,
        taskId,
        updates
      );
      await fetchTasks();
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setSaveError('Failed to update task. Please try again.');
    } finally {
      setIsTaskLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      setIsTaskLoading(true);
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.tasks,
        taskId
      );
      await fetchTasks();
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setSaveError('Failed to delete task. Please try again.');
    } finally {
      setIsTaskLoading(false);
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      due_at: '',
      status: 'Open'
    });
    setEditingTask(null);
  };

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title,
        description: task.description || '',
        due_at: task.due_at || '',
        status: task.status
      });
    } else {
      resetTaskForm();
    }
    setShowTaskModal(true);
  };

  const handleTaskSubmit = async () => {
    if (!taskForm.title.trim()) {
      setSaveError('Task title is required');
      return;
    }

    if (editingTask) {
      await updateTask(editingTask.id as string, taskForm);
    } else {
      await createTask();
    }
  };

  const changeTaskStatus = async (taskId: string, newStatus: 'Open' | 'InProgress' | 'Completed') => {
    await updateTask(taskId, { status: newStatus });
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
      case 'InProgress': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      case 'Completed': return 'text-green-400 bg-green-900/20 border-green-500/30';
      default: return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
    }
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

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

  const generateInvoice = async () => {
    if (!id || !matter) return;
    
    try {
      // Calculate totals from time entries or line items
      let subtotal = 0;
      let lineItems: unknown[] = [];
      
      if (invoiceForm.line_items.length > 0) {
        // Use custom line items
        lineItems = invoiceForm.line_items;
        subtotal = invoiceForm.line_items.reduce((sum, item) => sum + item.amount, 0);
      } else if (timeEntries.length > 0) {
        // Generate from unbilled time entries
        lineItems = timeEntries.map((entry) => ({
          description: entry.description || 'Legal Services',
          quantity: Number(entry.hours || 0),
          rate: Number(entry.rate || 150), // Default rate if not set
          amount: Number(entry.hours || 0) * Number(entry.rate || 150),
        }));
        subtotal = (lineItems as Record<string, unknown>[]).reduce((sum: number, item) => sum + Number(item.amount || 0), 0);
      }
      
      const invoiceNumber = `INV-${matter.matter_number}-${Date.now().toString().slice(-6)}`;
      
      const newInvoice = {
        matter_id: id,
        invoice_number: invoiceNumber,
        issue_date: new Date().toISOString(),
        due_date: invoiceForm.due_date,
        line_items: JSON.stringify(lineItems),
        subtotal: subtotal,
        taxes: 0,
        discounts: 0,
        total: subtotal,
        status: 'Draft',
      };
      
      const createdInvoice = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.invoices,
        'unique()',
        newInvoice
      );
      
      // Refresh billing data
      await fetchBillingData();
      setShowInvoiceModal(false);
      setInvoiceForm({
        description: '',
        line_items: [],
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        default_rate: 150,
        tax_rate: 0,
        discount_rate: 0,
      });
      setInvoiceLineItems([]);
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      
      return createdInvoice;
    } catch (error) {
      console.error('Error generating invoice:', error);
      setSaveError('Failed to generate invoice. Please try again.');
    }
  };

  const recordPayment = async (invoiceId: string, amount: number, method: string, reference?: string) => {
    try {
      const payment = {
        invoice_id: invoiceId,
        payment_method: method,
        amount: amount,
        received_at: new Date().toISOString(),
        reference: reference || '',
      };
      
      await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.payments,
        'unique()',
        payment
      );
      
      // Update invoice status to Paid if fully paid
      const invoice = invoices.find((inv) => (inv.$id || inv.id) === invoiceId);
      if (invoice) {
        const totalPaid = payments
          .filter((p) => p.invoice_id === invoiceId)
          .reduce((sum: number, p) => sum + Number(p.amount || 0), 0) + amount;
        
        if (totalPaid >= Number(invoice.total || 0)) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.invoices,
            invoiceId,
            { status: 'Paid' }
          );
        }
      }
      
      // Refresh billing data
      await fetchBillingData();
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      
      // Show success message
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error recording payment:', error);
      setSaveError('Failed to record payment. Please try again.');
    }
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!id) return;
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      // Try saving to matters; if rejected due to attribute limits, save to matters_meta
      let savedToMatters = true;
      try {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.matters,
          id,
          {
            case_data: JSON.stringify(criminalData || {}),
          }
        );
      } catch (err) {
        savedToMatters = false;
        const message = (err && typeof err === 'object' && 'message' in err) ? String((err as Error).message) : '';
        const attrLimit = message.toLowerCase().includes('attribute') || message.toLowerCase().includes('case_data');
        if (!attrLimit) throw err;
      }
      if (!savedToMatters) {
        const existing = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.mattersMeta,
          [Query.equal('matter_id', id)]
        );
        const payload = { matter_id: id, case_data: JSON.stringify(criminalData || {}) } as Record<string, unknown>;
        if (existing.documents && existing.documents.length > 0) {
          await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.mattersMeta,
            existing.documents[0].$id,
            payload
          );
        } else {
          await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.mattersMeta,
            'unique()',
            payload
          );
        }
      }
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      const message = (err && typeof err === 'object' && 'message' in err) ? String((err as Error).message) : 'Failed to save changes';
      if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('unauthorized')) {
        setSaveError('You do not have permission to update this matter. Ask an admin to grant update access or create a new matter yourself.');
      } else if (message.toLowerCase().includes('collection') && message.toLowerCase().includes('not be found')) {
        setSaveError('Storage collection for extended data is missing. Ensure the "matters_meta" collection exists in Firestore.');
      } else if (message.toLowerCase().includes('attribute') || message.toLowerCase().includes('case_data')) {
        setSaveError('The matter is missing the "case_data" field in Firestore. Add this field or run the provisioning script.');
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
            <h1 className="text-2xl font-bold text-white">{String(matter.title || '')}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-blue-200">Matter #{String(matter.matter_number || '')}</span>
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
              {String(matter.client_first_name || '')} {String(matter.client_last_name || '')}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-blue-200">
              {matter.client_email && (
                <div className="flex items-center">
                  <Mail className="mr-1 h-3 w-3" />
                  {String(matter.client_email)}
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
                  <p className="text-sm text-blue-200">{String(matter.description)}</p>
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

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Tasks</h4>
                <button
                  onClick={() => openTaskModal()}
                  className="inline-flex items-center px-3 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Add New Task
                </button>
              </div>

              {isTaskLoading ? (
                <div className="text-center py-8 text-blue-200">
                  <p>Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-blue-200">
                  <p>No tasks found for this matter. Add a new one!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-white">{task.title}</h5>
                          {task.description && (
                            <p className="text-sm text-blue-200 mt-1">{task.description}</p>
                          )}
                          <div className="flex items-center space-x-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>

                            {task.due_at && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isOverdue(task.due_at) ? 'bg-red-100/20 text-red-300' : 'bg-green-100/20 text-green-300'}`}>
                                {isOverdue(task.due_at) ? 'Overdue' : 'Due'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openTaskModal(task)}
                            className="p-2 hover:bg-white/10 rounded-lg text-blue-200 hover:text-white"
                            title="Edit Task"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => changeTaskStatus(task.id as string, task.status === 'Open' ? 'InProgress' : 'Completed')}
                            className="p-2 hover:bg-white/10 rounded-lg text-green-200 hover:text-green-300"
                            title={task.status === 'Open' ? 'Mark as In Progress' : 'Mark as Completed'}
                          >
                            {task.status === 'Open' ? (
                              <Play className="h-4 w-4" />
                            ) : (
                              <CheckCircle className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteTask(task.id as string)}
                            className="p-2 hover:bg-white/10 rounded-lg text-red-200 hover:text-red-300"
                            title="Delete Task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Header with Generate Invoice button */}
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-white">Billing & Invoices</h4>
                <button
                  onClick={() => setShowInvoiceModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Generate Invoice
                </button>
              </div>

              {/* Time Entries Section */}
              {timeEntries.length > 0 && (
                <div>
                  <h5 className="text-md font-medium text-white mb-3">Time Entries</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Description</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-blue-200 uppercase tracking-wider">Hours</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-blue-200 uppercase tracking-wider">Rate</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-blue-200 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {timeEntries.map((entry: any) => (
                          <tr key={entry.$id || entry.id}>
                            <td className="px-3 py-2 text-sm text-white">
                              {new Date(entry.entry_date || entry.$createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2 text-sm text-blue-200">{entry.description || 'Legal Services'}</td>
                            <td className="px-3 py-2 text-sm text-white text-right">{Number(entry.hours || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm text-white text-right">${Number(entry.rate || 150).toFixed(2)}</td>
                            <td className="px-3 py-2 text-sm text-white text-right">
                              ${(Number(entry.hours || 0) * Number(entry.rate || 150)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={4} className="px-3 py-2 text-sm font-medium text-white text-right">Total Unbilled:</td>
                          <td className="px-3 py-2 text-sm font-medium text-white text-right">
                            ${timeEntries.reduce((sum: number, e) => 
                              sum + (Number(e.hours || 0) * Number(e.rate || 150)), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Invoices Section */}
              <div>
                <h5 className="text-md font-medium text-white mb-3">Invoices</h5>
                {invoices.length === 0 ? (
                  <div className="text-center py-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                    <DollarSign className="mx-auto h-12 w-12 text-blue-300 mb-3" />
                    <p className="text-blue-200">No invoices generated yet.</p>
                    <p className="text-sm text-blue-300 mt-1">Click "Generate Invoice" to create your first invoice.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {invoices.map((invoice: any) => {
                      const invoicePayments = payments.filter((p) => 
                        p.invoice_id === (invoice.$id || invoice.id)
                      );
                      const totalPaid = invoicePayments.reduce((sum: number, p) => 
                        sum + Number(p.amount || 0), 0
                      );
                      const balance = Number(invoice.total || 0) - totalPaid;
                      
                      return (
                        <div key={invoice.$id || invoice.id} className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h5 className="font-medium text-white">Invoice #{invoice.invoice_number}</h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  invoice.status === 'Paid' ? 'bg-green-100/20 text-green-300' :
                                  invoice.status === 'Overdue' ? 'bg-red-100/20 text-red-300' :
                                  invoice.status === 'Sent' ? 'bg-blue-100/20 text-blue-300' :
                                  'bg-gray-100/20 text-gray-300'
                                }`}>
                                  {invoice.status}
                                </span>
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-blue-200">Issue Date:</span>
                                  <span className="ml-2 text-white">{new Date(invoice.issue_date || invoice.$createdAt).toLocaleDateString()}</span>
                                </div>
                                <div>
                                  <span className="text-blue-200">Due Date:</span>
                                  <span className="ml-2 text-white">{new Date(invoice.due_date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm text-blue-200">Total</p>
                              <p className="text-lg font-semibold text-white">${Number(invoice.total || 0).toFixed(2)}</p>
                              {totalPaid > 0 && (
                                <>
                                  <p className="text-sm text-green-300">Paid: ${totalPaid.toFixed(2)}</p>
                                  <p className="text-sm font-medium text-yellow-300">Balance: ${balance.toFixed(2)}</p>
                                </>
                              )}
                              {invoice.status !== 'Paid' && (
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(invoice);
                                    setShowPaymentModal(true);
                                  }}
                                  className="mt-2 inline-flex items-center px-3 py-1 border border-white/20 text-xs font-medium rounded text-blue-100 bg-white/10 hover:bg-white/20"
                                >
                                  Record Payment
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-blue-200">Total Billed</p>
                  <p className="text-2xl font-semibold text-white">
                    ${invoices.reduce((sum: number, inv) => sum + Number(inv.total || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-green-300">Total Paid</p>
                  <p className="text-2xl font-semibold text-white">
                    ${payments.reduce((sum: number, p) => sum + Number(p.amount || 0), 0).toFixed(2)}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
                  <p className="text-sm text-yellow-300">Outstanding</p>
                  <p className="text-2xl font-semibold text-white">
                    ${(invoices.reduce((sum: number, inv) => sum + Number(inv.total || 0), 0) - 
                       payments.reduce((sum: number, p) => sum + Number(p.amount || 0), 0)).toFixed(2)}
                  </p>
                </div>
              </div>
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

      {/* Invoice Generation Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowInvoiceModal(false)} />
            <div className="relative bg-gray-900 rounded-xl shadow-xl border border-white/10 p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Generate Invoice</h3>
              
              <div className="space-y-6">
                {/* Invoice Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-1">Issue Date</label>
                    <input
                      id="invoice_issue_date"
                      type="date"
                      value={invoiceForm.issue_date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, issue_date: e.target.value })}
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                      aria-label="Invoice Issue Date"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-1">Due Date</label>
                    <input
                      id="invoice_due_date"
                      type="date"
                      value={invoiceForm.due_date}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                      aria-label="Invoice Due Date"
                    />
                  </div>
                </div>

                {/* Available Time Entries */}
                {timeEntries.length > 0 && (
                  <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-200 mb-3">Available Time Entries</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {timeEntries.map((entry) => (
                        <div key={String(entry.id || entry.$id || Date.now())} className="flex items-center justify-between p-2 border border-blue-500/20 rounded">
                          <div className="flex-1">
                            <p className="text-sm text-blue-200">{String(entry.description || '')}</p>
                            <p className="text-xs text-blue-300">
                              {new Date(String(entry.entry_date || '')).toLocaleDateString()} • {Number(entry.hours || 0)}h @ ${Number(entry.rate || 0)}/hr
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-blue-200">${(Number(entry.hours || 0) * Number(entry.rate || 150)).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => addTimeEntryToInvoice(entry)}
                              className="text-blue-300 hover:text-blue-100 text-xs font-medium px-2 py-1 border border-blue-500/30 rounded hover:bg-blue-500/20"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-blue-200">Line Items</h4>
                    <button
                      type="button"
                      onClick={addCustomLineItem}
                      className="inline-flex items-center px-3 py-2 border border-blue-500/30 text-sm font-medium rounded-lg text-blue-200 bg-blue-500/20 hover:bg-blue-500/30"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Custom Item
                    </button>
                  </div>

                  {invoiceLineItems.length > 0 ? (
                    <div className="space-y-3">
                      {invoiceLineItems.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center p-3 border border-white/20 rounded-lg">
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateInvoiceLineItem(item.id, 'description', e.target.value)}
                              placeholder="Description"
                              className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.25"
                              value={item.quantity}
                              onChange={(e) => updateInvoiceLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                              placeholder="Qty"
                              className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <input
                              type="number"
                              step="0.01"
                              value={item.rate}
                              onChange={(e) => updateInvoiceLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                              placeholder="Rate"
                              className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40 text-sm"
                            />
                          </div>
                          <div className="col-span-2">
                            <p className="text-sm font-medium text-white">${item.amount.toFixed(2)}</p>
                          </div>
                          <div className="col-span-1">
                            <button
                              type="button"
                              onClick={() => removeInvoiceLineItem(item.id)}
                              className="text-red-400 hover:text-red-300"
                              title="Remove this line item"
                              aria-label="Remove line item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-blue-300">
                      <p>No line items added yet.</p>
                    </div>
                  )}
                </div>

                {/* Tax and Discount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-1">Tax Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={invoiceForm.tax_rate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-1">Discount Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={invoiceForm.discount_rate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, discount_rate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Invoice Totals */}
                {invoiceLineItems.length > 0 && (
                  <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-200 mb-3">Invoice Totals</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-300">Subtotal:</span>
                        <span className="text-white">${calculateInvoiceSubtotal().toFixed(2)}</span>
                      </div>
                      {invoiceForm.tax_rate > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-300">Tax ({invoiceForm.tax_rate}%):</span>
                          <span className="text-white">${calculateInvoiceTax().toFixed(2)}</span>
                        </div>
                      )}
                      {invoiceForm.discount_rate > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-300">Discount ({invoiceForm.discount_rate}%):</span>
                          <span className="text-white">-${calculateInvoiceDiscount().toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t border-white/20 pt-2">
                        <span className="text-white">Total:</span>
                        <span className="text-white">${calculateInvoiceTotal().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={generateInvoice}
                    disabled={invoiceLineItems.length === 0}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Recording Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPaymentModal(false)} />
            <div className="relative bg-gray-900 rounded-xl shadow-xl border border-white/10 p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-4">Record Payment</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-blue-200">Invoice #{String(selectedInvoice?.invoice_number || '')}</p>
                  <p className="text-lg font-semibold text-white">
                    Total: ${Number(selectedInvoice?.total || 0).toFixed(2)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">Payment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(selectedInvoice?.total || 0)}
                    id="payment-amount"
                    title="Payment Amount"
                    aria-label="Payment Amount"
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">Payment Method</label>
                  <select
                    id="payment-method"
                    title="Payment Method"
                    aria-label="Payment Method"
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="Card">Credit Card</option>
                    <option value="ACH">Bank Transfer (ACH)</option>
                    <option value="Check">Check</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">Reference Number (optional)</label>
                  <input
                    type="text"
                    id="payment-reference"
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Check number, transaction ID, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedInvoice(null);
                    }}
                    className="px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const amount = parseFloat((document.getElementById('payment-amount') as HTMLInputElement).value);
                      const method = (document.getElementById('payment-method') as HTMLSelectElement).value;
                      const reference = (document.getElementById('payment-reference') as HTMLInputElement).value;
                      recordPayment(
                        selectedInvoice?.$id as string || selectedInvoice?.id as string,
                        amount,
                        method,
                        reference
                      );
                    }}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                  >
                    Record Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Management Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTaskModal(false)} />
            <div className="relative bg-gray-900 rounded-xl shadow-xl border border-white/10 p-6 max-w-2xl w-full">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingTask ? 'Edit Task' : 'New Task'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">Title</label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Task title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">Description</label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Task description (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">Due Date (optional)</label>
                  <input
                    id="task_due_date"
                    type="date"
                    value={taskForm.due_at}
                    onChange={(e) => setTaskForm({ ...taskForm, due_at: e.target.value })}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                    aria-label="Task Due Date"
                  />
                </div>



                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">Status</label>
                  <select
                    id="task_status"
                    value={taskForm.status}
                    onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value as 'Open' | 'InProgress' | 'Completed' })}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-blue-500/40"
                    aria-label="Task Status"
                  >
                    <option value="Open">Open</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowTaskModal(false)}
                    className="px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTaskSubmit}
                    disabled={isTaskLoading}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {isTaskLoading ? 'Saving...' : editingTask ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
