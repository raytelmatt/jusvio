import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Save, Clock, FolderOpen } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

interface Matter {
  id: number;
  title: string;
  matter_number: string;
  practice_area: string;
  client_first_name: string;
  client_last_name: string;
}

export default function TimeEntry() {
  const navigate = useNavigate();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    matter_id: '',
    entry_date: new Date().toISOString().split('T')[0],
    hours: '',
    rate: '400',
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMatters();
  }, []);

  const fetchMatters = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, 'matters', []);
      setMatters((list.documents || []) as unknown as Matter[]);
    } catch (error) {
      console.error('Error fetching matters:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.matter_id) newErrors.matter_id = 'Matter is required';
    if (!formData.entry_date) newErrors.entry_date = 'Date is required';
    if (!formData.hours || parseFloat(formData.hours) <= 0) {
      newErrors.hours = 'Hours must be greater than 0';
    }
    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      newErrors.rate = 'Rate must be greater than 0';
    }
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.timeEntries, 'unique()', {
        matter_id: parseInt(formData.matter_id),
        entry_date: formData.entry_date,
        hours: parseFloat(formData.hours),
        rate: parseFloat(formData.rate),
        description: formData.description,
      });
      navigate('/billing');
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
        <Link to="/billing" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Log Time Entry</h1>
          <p className="text-blue-200">Record billable time for a matter</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 text-blue-300 mr-2" />
            <h3 className="text-lg font-semibold text-white">Time Entry Details</h3>
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
                <p className="mt-1 text-sm text-red-400">{errors.matter_id}</p>
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
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => setFormData({ ...formData, entry_date: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                    errors.entry_date ? 'border-red-400/50' : 'border-white/20'
                  }`}
                />
                {errors.entry_date && (
                  <p className="mt-1 text-sm text-red-400">{errors.entry_date}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">
                  Hours *
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  placeholder="0.25"
                  className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                    errors.hours ? 'border-red-400/50' : 'border-white/20'
                  }`}
                />
                {errors.hours && (
                  <p className="mt-1 text-sm text-red-400">{errors.hours}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">
                  Hourly Rate *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-blue-200 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                      errors.rate ? 'border-red-400/50' : 'border-white/20'
                    }`}
                  />
                </div>
                {errors.rate && (
                  <p className="mt-1 text-sm text-red-400">{errors.rate}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe the work performed..."
                className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                  errors.description ? 'border-red-400/50' : 'border-white/20'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
            </div>

            {formData.hours && formData.rate && (
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-200">Total Amount:</span>
                  <span className="text-xl font-bold text-white">
                    ${(parseFloat(formData.hours || '0') * parseFloat(formData.rate || '0')).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
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
            to="/billing"
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
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Log Time
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
