import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { databases, DATABASE_ID, COLLECTIONS, Query } from '@/react-app/lib/backend';
import { 
  FileText,
  Search,
  Filter,
  Eye,
  UserPlus,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

type IntakeRecord = {
  $id: string;
  type?: string;
  practice_area?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  case_description?: string;
  urgency_level?: string;
  submitted_at?: string;
  data?: string; // JSON
  status?: string; // optional: New | Reviewed | Converted
};

export default function IntakesAdmin() {
  const [intakes, setIntakes] = useState<IntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [practiceFilter, setPracticeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [convertingId, setConvertingId] = useState<string | null>(null);

  useEffect(() => { void loadIntakes(); }, []);

  async function loadIntakes() {
    setLoading(true);
    setError(null);
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.intakes, [
        Query.orderDesc('submitted_at'),
        Query.limit(1000),
      ]);
      const rows = (list.documents || []).map((d: any) => ({
        $id: String(d.$id || d.id),
        type: d.type,
        practice_area: d.practice_area,
        first_name: d.first_name,
        last_name: d.last_name,
        email: d.email,
        phone: d.phone,
        case_description: d.case_description,
        urgency_level: d.urgency_level,
        submitted_at: d.submitted_at || d.$createdAt,
        data: d.data,
        status: d.status || 'New',
      })) as IntakeRecord[];
      setIntakes(rows);
    } catch (e) {
      setError('Failed to load intakes');
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return intakes.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch = !s || (
        (r.first_name || '').toLowerCase().includes(s) ||
        (r.last_name || '').toLowerCase().includes(s) ||
        (r.email || '').toLowerCase().includes(s) ||
        (r.case_description || '').toLowerCase().includes(s)
      );
      const matchesType = typeFilter === 'all' || (r.type || '').toLowerCase() === typeFilter;
      const matchesPractice = practiceFilter === 'all' || (r.practice_area || '').toLowerCase() === practiceFilter;
      const matchesStatus = statusFilter === 'all' || (r.status || 'New').toLowerCase() === statusFilter;
      return matchesSearch && matchesType && matchesPractice && matchesStatus;
    });
  }, [intakes, search, typeFilter, practiceFilter, statusFilter]);

  async function markReviewed(id: string) {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.intakes, id, { status: 'Reviewed' });
      setIntakes(prev => prev.map(i => i.$id === id ? { ...i, status: 'Reviewed' } : i));
    } catch (e) {
      alert('Failed to mark as reviewed');
    }
  }

  async function convertToClientAndMatter(rec: IntakeRecord) {
    if (convertingId) return;
    setConvertingId(rec.$id);
    try {
      const full = safeParse(rec.data);
      const first = rec.first_name || full.first_name || '';
      const last = rec.last_name || full.last_name || '';
      const email = rec.email || full.email || '';
      const phone = rec.phone || full.phone || '';
      const practice = (rec.practice_area || full.practice_area || 'General') as string;
      // 1) Try find existing client by email
      let clientId: string | null = null;
      if (email) {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.clients, [Query.equal('email', email), Query.limit(1)]);
        const found = (res.documents || [])[0];
        clientId = found ? String((found as any).$id || (found as any).id) : null;
      }
      // 2) Create client if not found
      if (!clientId) {
        const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.clients, 'unique()', {
          first_name: first,
          last_name: last,
          email: email || null,
          phones: JSON.stringify(phone ? [phone] : []),
          preferred_contact_method: full?.preferred_contact_method || 'Email',
          address: full?.address ? JSON.stringify(full.address) : null,
          emergency_contact: full?.emergency_contact ? JSON.stringify(full.emergency_contact) : null,
          portal_enabled: false,
          notifications_opt_in: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        clientId = String((created as any).$id || (created as any).id);
      }

      // 3) Create matter
      const matterNumber = `MT${Date.now().toString().slice(-6)}`;
      const title = (rec.case_description || '').slice(0, 80) || `${practice} Case for ${first} ${last}`;
      await databases.createDocument(DATABASE_ID, COLLECTIONS.matters, 'unique()', {
        matter_number: matterNumber,
        title,
        practice_area: practice,
        status: 'Intake',
        client_id: clientId,
        fee_model: 'Progressive',
        opened_at: new Date().toISOString(),
        description: rec.case_description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 4) Update intake status
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.intakes, rec.$id, { status: 'Converted' });
      setIntakes(prev => prev.map(i => i.$id === rec.$id ? { ...i, status: 'Converted' } : i));
      alert('Converted intake to client + matter');
    } catch (e) {
      alert('Conversion failed. See console for details.');
      console.error(e);
    } finally {
      setConvertingId(null);
    }
  }

  function safeParse(json?: string) {
    try { return json ? JSON.parse(json) : {}; } catch { return {}; }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FileText className="mr-3 h-6 w-6 text-blue-300" />
            Intakes
          </h1>
          <p className="text-blue-200">Review and convert submitted intakes</p>
        </div>
        <button onClick={() => void loadIntakes()} className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
            <input
              type="text"
              placeholder="Search name, email, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
            />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white">
            <option value="all" className="bg-slate-800 text-white">All Types</option>
            <option value="general" className="bg-slate-800 text-white">General</option>
            <option value="criminal" className="bg-slate-800 text-white">Criminal</option>
          </select>
          <select value={practiceFilter} onChange={(e) => setPracticeFilter(e.target.value)} className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white">
            <option value="all" className="bg-slate-800 text-white">All Practice Areas</option>
            <option value="criminal" className="bg-slate-800 text-white">Criminal</option>
            <option value="personalinjury" className="bg-slate-800 text-white">Personal Injury</option>
            <option value="ssd" className="bg-slate-800 text-white">SSD</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 text-white">
            <option value="all" className="bg-slate-800 text-white">All Status</option>
            <option value="new" className="bg-slate-800 text-white">New</option>
            <option value="reviewed" className="bg-slate-800 text-white">Reviewed</option>
            <option value="converted" className="bg-slate-800 text-white">Converted</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Submitted</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Practice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">Status</th>
                <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white/5 divide-y divide-white/10">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-blue-200">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-red-300">{error}</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-blue-200">No intakes found</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.$id} className="hover:bg-white/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">{new Date(r.submitted_at || '').toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200 capitalize">{r.type || 'general'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200 capitalize">{r.practice_area || 'General'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{r.first_name} {r.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">{r.email || r.phone || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-200">{r.urgency_level || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (r.status || 'New') === 'Converted' ? 'bg-green-100 text-green-800' :
                        (r.status || 'New') === 'Reviewed' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {(r.status || 'New')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2 justify-end">
                        <button
                          onClick={() => alert(JSON.stringify(safeParse(r.data), null, 2))}
                          className="text-blue-300 hover:text-blue-100"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void markReviewed(r.$id)}
                          className="text-yellow-300 hover:text-yellow-100"
                          title="Mark reviewed"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          disabled={convertingId === r.$id}
                          onClick={() => void convertToClientAndMatter(r)}
                          className="text-green-300 hover:text-green-100 disabled:opacity-50"
                          title="Convert to Client + Matter"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                        <Link to="/matters/new" className="text-blue-300 hover:text-blue-100" title="Create matter manually">
                          <FolderOpen className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

