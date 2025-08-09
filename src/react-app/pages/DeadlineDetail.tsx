import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { 
  ArrowLeft, 
  AlertCircle,
  CheckSquare,
  Calendar,
  User,
  MessageCircle,
  Mail,
  Plus,
  FileText,
  Edit3
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

export default function DeadlineDetail() {
  const { id } = useParams();
  const [deadline, setDeadline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (id) {
      fetchDeadlineDetails();
    }
  }, [id]);

  const fetchDeadlineDetails = async () => {
    if (!id) return;

    try {
      const data = await databases.getDocument(DATABASE_ID, COLLECTIONS.deadlines, String(id));
      const notesList = await databases.listDocuments(DATABASE_ID, COLLECTIONS.deadlineNotes, []);
      const notes = (notesList.documents || []).filter((n: any) => String(n.deadline_id) === String(id));
      setDeadline({ ...(data as any), notes });
    } catch (error) {
      console.error('Error fetching deadline:', error);
      setError(error instanceof Error ? error.message : 'Failed to load deadline');
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!id || !newNote.trim()) return;

    setAddingNote(true);
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.deadlineNotes, 'unique()', {
        deadline_id: String(id),
        note: newNote.trim(),
        created_by_email: '',
        created_at: new Date().toISOString(),
      } as any);
      setNewNote('');
      fetchDeadlineDetails();
    } catch (error) {
      console.error('Error adding note:', error);
    } finally {
      setAddingNote(false);
    }
  };

  const completeDeadline = async () => {
    if (!id || !confirm('Mark this deadline as completed?')) return;

    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.deadlines, String(id), { status: 'Completed' });
      fetchDeadlineDetails();
    } catch (error) {
      console.error('Error completing deadline:', error);
    }
  };

  const getPriorityColor = (daysUntilDue: number, status: string) => {
    if (status === 'Completed') return 'text-green-600';
    if (daysUntilDue < 0) return 'text-red-600';
    if (daysUntilDue <= 1) return 'text-red-600';
    if (daysUntilDue <= 3) return 'text-orange-600';
    if (daysUntilDue <= 7) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getPriorityBadge = (daysUntilDue: number, status: string) => {
    if (status === 'Completed') {
      return 'bg-green-100 text-green-800';
    }
    if (daysUntilDue < 0) {
      return 'bg-red-100 text-red-800';
    }
    if (daysUntilDue <= 1) {
      return 'bg-red-100 text-red-800';
    }
    if (daysUntilDue <= 3) {
      return 'bg-orange-100 text-orange-800';
    }
    if (daysUntilDue <= 7) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getStatusText = (daysUntilDue: number, status: string) => {
    if (status === 'Completed') return 'Completed';
    if (daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue === 0) return 'Due Today';
    if (daysUntilDue === 1) return 'Due Tomorrow';
    return `Due in ${daysUntilDue} days`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/deadlines" className="p-2 hover:bg-gray-100 rounded-lg">
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/deadlines" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Error Loading Deadline</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!deadline) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Deadline not found</p>
        <Link to="/deadlines" className="text-blue-600 hover:text-blue-700">
          Back to deadlines
        </Link>
      </div>
    );
  }

  const dueDate = new Date(deadline.due_at);
  const daysUntilDue = deadline.days_until_due;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/deadlines" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{deadline.title}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(daysUntilDue, deadline.status)}`}>
                {getStatusText(daysUntilDue, deadline.status)}
              </span>
              <span className="text-sm text-gray-500">Source: {deadline.source}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {deadline.status !== 'Completed' && (
            <button
              onClick={completeDeadline}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Mark Complete
            </button>
          )}
          <Link
            to={`/matters/${deadline.matter_id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Matter
          </Link>
        </div>
      </div>

      {/* Deadline Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Due Date</p>
              <p className={`text-lg font-semibold ${getPriorityColor(daysUntilDue, deadline.status)}`}>
                {dueDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
              <p className="text-xs text-gray-500">
                {dueDate.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Matter</p>
              <Link 
                to={`/matters/${deadline.matter_id}`}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600"
              >
                {deadline.matter_title}
              </Link>
              <p className="text-xs text-gray-500">{deadline.client_name}</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className={`text-lg font-semibold ${getPriorityColor(daysUntilDue, deadline.status)}`}>
                {getStatusText(daysUntilDue, deadline.status)}
              </p>
              <p className="text-xs text-gray-500">
                {deadline.status === 'Completed' ? 'Task completed' : 
                 daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days past due` : 
                 daysUntilDue === 0 ? 'Due today' : 
                 `${daysUntilDue} days remaining`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notes & Updates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Edit3 className="mr-2 h-5 w-5" />
              Notes & Updates
            </h3>
          </div>
          
          <div className="p-6">
            {/* Add Note Form */}
            <div className="mb-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note or update about this deadline..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={addNote}
                  disabled={!newNote.trim() || addingNote}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingNote ? (
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes List */}
            <div className="space-y-4">
              {deadline.notes && deadline.notes.length > 0 ? (
                deadline.notes.map((note: any) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {note.created_by_email || 'System User'}
                        </span>
                      </div>
                      <time className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleDateString()} at{' '}
                        {new Date(note.created_at).toLocaleTimeString()}
                      </time>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.note}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Edit3 className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm">No notes yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add notes to track updates and progress
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Email Communications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              Email Communications ({deadline.communications?.length || 0})
            </h3>
          </div>
          
          <div className="p-6">
            {deadline.communications && deadline.communications.length > 0 ? (
              <div className="space-y-4">
                {deadline.communications.map((comm: any) => {
                  const isInbound = comm.direction === 'Inbound';
                  const commDate = new Date(comm.sent_at || comm.created_at);
                  
                  return (
                    <div
                      key={comm.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        isInbound 
                          ? 'bg-blue-50 border-l-blue-500' 
                          : 'bg-green-50 border-l-green-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {isInbound ? comm.from_address : comm.to_address}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            isInbound 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {comm.direction}
                          </span>
                        </div>
                        <time className="text-xs text-gray-500">
                          {commDate.toLocaleDateString()} at{' '}
                          {commDate.toLocaleTimeString()}
                        </time>
                      </div>
                      
                      {comm.meta && JSON.parse(comm.meta).subject && (
                        <p className="text-sm font-medium text-gray-800 mb-2">
                          Subject: {JSON.parse(comm.meta).subject}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {comm.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm">No email communications</p>
                <p className="text-xs text-gray-400 mt-1">
                  Email replies about this deadline will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
