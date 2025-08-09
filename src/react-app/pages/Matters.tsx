import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Plus, Search, MoreHorizontal, FolderOpen } from 'lucide-react';
import { databases, DATABASE_ID } from '@/react-app/lib/appwrite';

const PRACTICE_AREA_COLORS = {
  Criminal: 'bg-red-100 text-red-800',
  PersonalInjury: 'bg-blue-100 text-blue-800',
  SSD: 'bg-green-100 text-green-800',
};

const STATUS_COLORS = {
  Intake: 'bg-yellow-100 text-yellow-800',
  Open: 'bg-green-100 text-green-800',
  Pending: 'bg-blue-100 text-blue-800',
  Closed: 'bg-gray-100 text-gray-800',
};

export default function Matters() {
  const [matters, setMatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const practiceAreaFilter = searchParams.get('practice_area');
  const statusFilter = searchParams.get('status');

  useEffect(() => {
    fetchMatters();
  }, [practiceAreaFilter, statusFilter]);

  const fetchMatters = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, 'matters', []);
      setMatters(list.documents || []);
    } catch (error) {
      console.error('Error fetching matters:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatters = matters.filter(matter =>
    matter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    matter.matter_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${matter.client_first_name} ${matter.client_last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const clearFilters = () => {
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Matters</h1>
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
          <h1 className="text-2xl font-bold text-bright">Matters</h1>
          <p className="text-bright-secondary">Manage all case files and legal matters</p>
        </div>
        <Link
          to="/matters/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Matter
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search matters by title, number, or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={practiceAreaFilter || ''}
            onChange={(e) => {
              if (e.target.value) {
                setSearchParams(prev => ({
                  ...Object.fromEntries(prev),
                  practice_area: e.target.value
                }));
              } else {
                setSearchParams(prev => {
                  const newParams = new URLSearchParams(prev);
                  newParams.delete('practice_area');
                  return newParams;
                });
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Practice Areas</option>
            <option value="Criminal">Criminal Defense</option>
            <option value="PersonalInjury">Personal Injury</option>
            <option value="SSD">Social Security Disability</option>
          </select>
          <select
            value={statusFilter || ''}
            onChange={(e) => {
              if (e.target.value) {
                setSearchParams(prev => ({
                  ...Object.fromEntries(prev),
                  status: e.target.value
                }));
              } else {
                setSearchParams(prev => {
                  const newParams = new URLSearchParams(prev);
                  newParams.delete('status');
                  return newParams;
                });
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Intake">Intake</option>
            <option value="Open">Open</option>
            <option value="Pending">Pending</option>
            <option value="Closed">Closed</option>
          </select>
          {(practiceAreaFilter || statusFilter) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Matters Grid/List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredMatters.length === 0 ? (
          <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-12 text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-blue-300 mb-4" />
            <div className="text-bright-secondary mb-2">
              {searchTerm || practiceAreaFilter || statusFilter ? 'No matters found matching your criteria.' : 'No matters yet.'}
            </div>
            {!searchTerm && !practiceAreaFilter && !statusFilter && (
              <Link
                to="/matters/new"
                className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="mr-1 h-4 w-4" />
                Create your first matter
              </Link>
            )}
          </div>
        ) : (
          filteredMatters.map((matter) => (
            <div key={matter.id} className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 hover:shadow-2xl transition-all duration-200 hover:-translate-y-1">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        to={`/matters/${matter.id}`}
                        className="text-lg font-semibold text-bright hover:text-blue-300"
                      >
                        {matter.title}
                      </Link>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        PRACTICE_AREA_COLORS[matter.practice_area as keyof typeof PRACTICE_AREA_COLORS]
                      }`}>
                        {matter.practice_area === 'PersonalInjury' ? 'Personal Injury' : matter.practice_area}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[matter.status as keyof typeof STATUS_COLORS]
                      }`}>
                        {matter.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-bright-secondary">
                      <span>Matter #{matter.matter_number}</span>
                      <span>Client: {matter.client_first_name} {matter.client_last_name}</span>
                      <span>Opened: {new Date(matter.opened_at || matter.created_at).toLocaleDateString()}</span>
                      <span className="capitalize">{matter.fee_model === 'FlatRate' ? 'Flat Rate' : 'Progressive'}</span>
                    </div>
                    {matter.description && (
                      <p className="mt-2 text-sm text-bright-accent line-clamp-2">{matter.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/matters/${matter.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                    >
                      View
                    </Link>
                    <button 
                      onClick={() => alert('Matter actions menu would be implemented here')}
                      className="p-1.5 text-gray-400 hover:text-gray-600"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
