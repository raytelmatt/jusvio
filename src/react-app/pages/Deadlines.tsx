import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { 
  Plus, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Calendar,
  User,
  FolderOpen,
  Eye
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

interface Deadline {
  id: number;
  matter_id: number;
  matter_title: string;
  client_name: string;
  practice_area: string;
  title: string;
  source: 'Rule' | 'CourtOrder' | 'SSA' | 'Manual';
  due_at: string;
  status: 'Open' | 'Completed' | 'PastDue';
  responsible_users: string[];
  days_until_due: number;
}

export default function Deadlines() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [practiceAreaFilter, setPracticeAreaFilter] = useState<string>('');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('');

  useEffect(() => {
    fetchDeadlines();
  }, [statusFilter, practiceAreaFilter, urgencyFilter]);

  const fetchDeadlines = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.deadlines, []);
      setDeadlines((list.documents || []) as unknown as Deadline[]);
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (deadlineId: number) => {
    try {
      const target = deadlines.find(d => d.id === deadlineId);
      if (!target) return;
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.deadlines, String(deadlineId), { status: 'Completed' });
      setDeadlines(prev => prev.map(deadline => 
        deadline.id === deadlineId 
          ? { ...deadline, status: 'Completed' as const }
          : deadline
      ));
    } catch (error) {
      console.error('Error marking deadline complete:', error);
    }
  };

  const getUrgencyClass = (daysUntilDue: number, status: string) => {
    if (status === 'Completed') return 'bg-green-50 border-green-200';
    if (status === 'PastDue') return 'bg-red-50 border-red-200';
    if (daysUntilDue <= 1) return 'bg-red-50 border-red-200';
    if (daysUntilDue <= 7) return 'bg-orange-50 border-orange-200';
    if (daysUntilDue <= 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-white border-gray-200';
  };

  const getUrgencyIcon = (daysUntilDue: number, status: string) => {
    if (status === 'Completed') return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (status === 'PastDue' || daysUntilDue <= 1) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (daysUntilDue <= 7) return <AlertTriangle className="h-5 w-5 text-orange-600" />;
    return <Clock className="h-5 w-5 text-blue-600" />;
  };

  const formatDueDate = (dueAt: string, daysUntilDue: number, status: string) => {
    const date = new Date(dueAt);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });

    if (status === 'Completed') return `${formattedDate} (Completed)`;
    if (status === 'PastDue') return `${formattedDate} (Overdue)`;
    if (daysUntilDue === 0) return `${formattedDate} (Due Today)`;
    if (daysUntilDue === 1) return `${formattedDate} (Due Tomorrow)`;
    if (daysUntilDue < 0) return `${formattedDate} (${Math.abs(daysUntilDue)} days overdue)`;
    return `${formattedDate} (${daysUntilDue} days)`;
  };

  const practiceAreaColors = {
    Criminal: 'bg-red-100 text-red-800',
    PersonalInjury: 'bg-blue-100 text-blue-800',
    SSD: 'bg-green-100 text-green-800',
  };

  const sourceColors = {
    Rule: 'bg-purple-100 text-purple-800',
    CourtOrder: 'bg-red-100 text-red-800',
    SSA: 'bg-green-100 text-green-800',
    Manual: 'bg-gray-100 text-gray-800',
  };

  // Group deadlines by urgency
  const groupedDeadlines = {
    overdue: deadlines.filter(d => d.status === 'PastDue' || (d.status === 'Open' && d.days_until_due < 0)),
    urgent: deadlines.filter(d => d.status === 'Open' && d.days_until_due >= 0 && d.days_until_due <= 7),
    upcoming: deadlines.filter(d => d.status === 'Open' && d.days_until_due > 7 && d.days_until_due <= 30),
    future: deadlines.filter(d => d.status === 'Open' && d.days_until_due > 30),
    completed: deadlines.filter(d => d.status === 'Completed'),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Deadlines</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Deadlines</h1>
          <p className="text-gray-600">Track important dates and filing deadlines</p>
        </div>
        <Link
          to="/deadlines/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Deadline
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Completed">Completed</option>
            <option value="PastDue">Past Due</option>
          </select>
          
          <select
            value={practiceAreaFilter}
            onChange={(e) => setPracticeAreaFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Practice Areas</option>
            <option value="Criminal">Criminal Defense</option>
            <option value="PersonalInjury">Personal Injury</option>
            <option value="SSD">Social Security Disability</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Timeframes</option>
            <option value="overdue">Overdue</option>
            <option value="week">Next 7 days</option>
            <option value="month">Next 30 days</option>
          </select>

          {(statusFilter || practiceAreaFilter || urgencyFilter) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setPracticeAreaFilter('');
                setUrgencyFilter('');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{groupedDeadlines.overdue.length}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due This Week</p>
              <p className="text-2xl font-bold text-orange-600">{groupedDeadlines.urgent.length}</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Due This Month</p>
              <p className="text-2xl font-bold text-yellow-600">{groupedDeadlines.upcoming.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{groupedDeadlines.completed.length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Deadlines List */}
      <div className="space-y-4">
        {/* Overdue */}
        {groupedDeadlines.overdue.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h3 className="text-lg font-semibold text-red-900 flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5" />
                Overdue ({groupedDeadlines.overdue.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedDeadlines.overdue.map((deadline) => (
                <DeadlineRow
                  key={deadline.id}
                  deadline={deadline}
                  practiceAreaColors={practiceAreaColors}
                  sourceColors={sourceColors}
                  getUrgencyClass={getUrgencyClass}
                  getUrgencyIcon={getUrgencyIcon}
                  formatDueDate={formatDueDate}
                  markCompleted={markCompleted}
                />
              ))}
            </div>
          </div>
        )}

        {/* Urgent (Next 7 days) */}
        {groupedDeadlines.urgent.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
              <h3 className="text-lg font-semibold text-orange-900 flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Due This Week ({groupedDeadlines.urgent.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedDeadlines.urgent.map((deadline) => (
                <DeadlineRow
                  key={deadline.id}
                  deadline={deadline}
                  practiceAreaColors={practiceAreaColors}
                  sourceColors={sourceColors}
                  getUrgencyClass={getUrgencyClass}
                  getUrgencyIcon={getUrgencyIcon}
                  formatDueDate={formatDueDate}
                  markCompleted={markCompleted}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upcoming (Next 30 days) */}
        {groupedDeadlines.upcoming.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Due This Month ({groupedDeadlines.upcoming.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {groupedDeadlines.upcoming.map((deadline) => (
                <DeadlineRow
                  key={deadline.id}
                  deadline={deadline}
                  practiceAreaColors={practiceAreaColors}
                  sourceColors={sourceColors}
                  getUrgencyClass={getUrgencyClass}
                  getUrgencyIcon={getUrgencyIcon}
                  formatDueDate={formatDueDate}
                  markCompleted={markCompleted}
                />
              ))}
            </div>
          </div>
        )}

        {/* All other deadlines */}
        {(groupedDeadlines.future.length > 0 || groupedDeadlines.completed.length > 0) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                All Deadlines ({groupedDeadlines.future.length + groupedDeadlines.completed.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {[...groupedDeadlines.future, ...groupedDeadlines.completed]
                .sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime())
                .map((deadline) => (
                  <DeadlineRow
                    key={deadline.id}
                    deadline={deadline}
                    practiceAreaColors={practiceAreaColors}
                    sourceColors={sourceColors}
                    getUrgencyClass={getUrgencyClass}
                    getUrgencyIcon={getUrgencyIcon}
                    formatDueDate={formatDueDate}
                    markCompleted={markCompleted}
                  />
                ))}
            </div>
          </div>
        )}

        {deadlines.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-gray-500 mb-2">No deadlines found</div>
            <Link
              to="/deadlines/new"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Add your first deadline
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

interface DeadlineRowProps {
  deadline: Deadline;
  practiceAreaColors: Record<string, string>;
  sourceColors: Record<string, string>;
  getUrgencyClass: (days: number, status: string) => string;
  getUrgencyIcon: (days: number, status: string) => React.ReactNode;
  formatDueDate: (due: string, days: number, status: string) => string;
  markCompleted: (id: number) => void;
}

function DeadlineRow({
  deadline,
  practiceAreaColors,
  sourceColors,
  getUrgencyClass,
  getUrgencyIcon,
  formatDueDate,
  markCompleted
}: DeadlineRowProps) {
  return (
    <div className={`p-6 hover:bg-gray-50 ${getUrgencyClass(deadline.days_until_due, deadline.status)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            {getUrgencyIcon(deadline.days_until_due, deadline.status)}
            <h4 className="text-lg font-medium text-gray-900">{deadline.title}</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              practiceAreaColors[deadline.practice_area as keyof typeof practiceAreaColors]
            }`}>
              {deadline.practice_area === 'PersonalInjury' ? 'PI' : deadline.practice_area}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              sourceColors[deadline.source as keyof typeof sourceColors]
            }`}>
              {deadline.source}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center">
              <FolderOpen className="mr-2 h-4 w-4 text-gray-400" />
              <Link
                to={`/matters/${deadline.matter_id}`}
                className="hover:text-blue-600"
              >
                {deadline.matter_title}
              </Link>
            </div>
            <div className="flex items-center">
              <User className="mr-2 h-4 w-4 text-gray-400" />
              {deadline.client_name}
            </div>
            <div className="flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              {formatDueDate(deadline.due_at, deadline.days_until_due, deadline.status)}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Link
            to={`/deadlines/${deadline.id}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="mr-1 h-4 w-4" />
            Details
          </Link>
          {deadline.status === 'Open' && (
            <button
              onClick={() => markCompleted(deadline.id)}
              className="inline-flex items-center px-3 py-1.5 border border-green-300 text-sm font-medium rounded-lg text-green-700 bg-white hover:bg-green-50"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Complete
            </button>
          )}
          <Link
            to={`/matters/${deadline.matter_id}`}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            View Matter
          </Link>
        </div>
      </div>
    </div>
  );
}
