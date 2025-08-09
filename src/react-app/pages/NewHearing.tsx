import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Save, Calendar, FolderOpen } from 'lucide-react';

interface Matter {
  id: number;
  title: string;
  matter_number: string;
  practice_area: string;
  client_first_name: string;
  client_last_name: string;
}

export default function NewHearing() {
  const navigate = useNavigate();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    matter_id: '',
    hearing_type: '',
    start_at: '',
    end_at: '',
    courtroom: '',
    judge_or_alj: '',
    notes: '',
    is_ssa_hearing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMatters();
  }, []);

  const fetchMatters = async () => {
    try {
      const response = await fetch('/api/matters', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMatters(data);
      }
    } catch (error) {
      console.error('Error fetching matters:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.matter_id) newErrors.matter_id = 'Matter is required';
    if (!formData.hearing_type.trim()) newErrors.hearing_type = 'Hearing type is required';
    if (!formData.start_at) newErrors.start_at = 'Start date/time is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/hearings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          matter_id: parseInt(formData.matter_id),
          hearing_type: formData.hearing_type,
          start_at: new Date(formData.start_at).toISOString(),
          end_at: formData.end_at ? new Date(formData.end_at).toISOString() : null,
          courtroom: formData.courtroom || null,
          judge_or_alj: formData.judge_or_alj || null,
          notes: formData.notes || null,
          is_ssa_hearing: formData.is_ssa_hearing,
        }),
      });

      if (response.ok) {
        navigate('/calendar');
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || 'Failed to schedule hearing' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedMatter = matters.find(m => m.id.toString() === formData.matter_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/calendar" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Hearing</h1>
          <p className="text-gray-600">Add a new court hearing or appointment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-blue-300 mr-2" />
            <h3 className="text-lg font-semibold text-white">Hearing Details</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Matter *
              </label>
              <select
                value={formData.matter_id}
                onChange={(e) => setFormData({ ...formData, matter_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                  errors.matter_id ? 'border-red-400/50' : 'border-white/20'
                }`}
              >
                <option value="" className="bg-slate-800 text-white">Select a matter...</option>
                {matters.map((matter) => (
                  <option key={matter.id} value={matter.id} className="bg-slate-800 text-white">
                    {matter.title} - {matter.client_first_name} {matter.client_last_name}
                  </option>
                ))}
              </select>
              {errors.matter_id && (
                <p className="mt-1 text-sm text-red-600">{errors.matter_id}</p>
              )}
            </div>

            {selectedMatter && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{selectedMatter.title}</p>
                    <p className="text-sm text-blue-200">
                      {selectedMatter.matter_number} • {selectedMatter.practice_area}
                    </p>
                  </div>
                </div>
                
                {selectedMatter.practice_area === 'SSD' && (
                  <div className="mt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.is_ssa_hearing}
                        onChange={(e) => setFormData({ ...formData, is_ssa_hearing: e.target.checked })}
                        className="mr-2 rounded border-white/20 text-blue-600 focus:ring-blue-500 bg-white/10"
                      />
                      <span className="text-sm text-blue-200">This is an SSA hearing</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Hearing Type *
              </label>
              <input
                type="text"
                value={formData.hearing_type}
                onChange={(e) => setFormData({ ...formData, hearing_type: e.target.value })}
                placeholder="e.g., Arraignment, Motion Hearing, Trial"
                className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                  errors.hearing_type ? 'border-red-400/50' : 'border-white/20'
                }`}
              />
              {errors.hearing_type && (
                <p className="mt-1 text-sm text-red-400">{errors.hearing_type}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">
                  Start Date/Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.start_at}
                  onChange={(e) => setFormData({ ...formData, start_at: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                    errors.start_at ? 'border-red-400/50' : 'border-white/20'
                  }`}
                />
                {errors.start_at && (
                  <p className="mt-1 text-sm text-red-400">{errors.start_at}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">
                  End Date/Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.end_at}
                  onChange={(e) => setFormData({ ...formData, end_at: e.target.value })}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">
                  Courtroom
                </label>
                <input
                  type="text"
                  value={formData.courtroom}
                  onChange={(e) => setFormData({ ...formData, courtroom: e.target.value })}
                  placeholder="e.g., 3A, Main Courtroom"
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">
                  {formData.is_ssa_hearing ? 'ALJ' : 'Judge'}
                </label>
                <input
                  type="text"
                  value={formData.judge_or_alj}
                  onChange={(e) => setFormData({ ...formData, judge_or_alj: e.target.value })}
                  placeholder={formData.is_ssa_hearing ? 'Administrative Law Judge' : 'Judge Name'}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                placeholder="Additional notes about the hearing..."
                className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-sm text-red-200">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-white/10">
          <Link
            to="/calendar"
            className="px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Scheduling...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Schedule Hearing
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
