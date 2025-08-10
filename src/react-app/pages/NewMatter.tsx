import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Permission, Role } from 'appwrite';
import { useAuth } from '@/react-app/auth/AuthProvider';
import { ArrowLeft, Save, User, FolderOpen, DollarSign } from 'lucide-react';
import type { Client } from '@/shared/types';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

export default function NewMatter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    title: '',
    practice_area: '',
    description: '',
    fee_model: 'Progressive',
    flat_rate_amount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    // Preselect client if provided via query param
    const params = new URLSearchParams(window.location.search);
    const preselectedClientId = params.get('client_id');
    if (preselectedClientId) {
      setFormData((prev) => ({ ...prev, client_id: preselectedClientId }));
    }
  }, []);

  const fetchClients = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.clients, []);
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      }));
      setClients(rows as unknown as Client[]);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.client_id) newErrors.client_id = 'Client is required';
    if (!formData.title.trim()) newErrors.title = 'Matter title is required';
    if (!formData.practice_area) newErrors.practice_area = 'Practice area is required';
    if (formData.fee_model === 'FlatRate' && !formData.flat_rate_amount) {
      newErrors.flat_rate_amount = 'Flat rate amount is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const matterNumber = `MT${Date.now().toString().slice(-6)}`;
      const payload: any = {
        matter_number: matterNumber,
        title: formData.title,
        practice_area: formData.practice_area,
        status: 'Open',
        client_id: formData.client_id,
        fee_model: formData.fee_model,
        opened_at: new Date().toISOString(),
      };
      if (formData.description.trim()) {
        payload.description = formData.description.trim();
      }
      if (formData.fee_model === 'FlatRate' && formData.flat_rate_amount) {
        payload.flat_rate_amount = parseFloat(formData.flat_rate_amount);
      }

      const permissions = user ? [
        Permission.read(Role.user((user as any).$id)),
        Permission.update(Role.user((user as any).$id)),
        Permission.delete(Role.user((user as any).$id)),
      ] : [];

      const created = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.matters,
        'unique()',
        payload,
        permissions
      );
      // Ensure navigation occurs after state update cycle
      setTimeout(() => navigate(`/matters/${created.$id}`), 0);
    } catch (error) {
      console.error('Error creating matter:', error);
      const message = (error as any)?.message || 'Error creating matter. Please check required fields and try again.';
      setErrors({ submit: message });
      try { alert(message); } catch {}
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id.toString() === formData.client_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/matters" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Matter</h1>
          <p className="text-blue-200">Create a new legal matter</p>
        </div>
      </div>

      <form id="new-matter-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
        {/* Client Selection */}
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-blue-300 mr-2" />
            <h3 className="text-lg font-semibold text-white">Client Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Select Client *
              </label>
              <select
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 focus:text-white transition-all duration-200 ${
                  errors.client_id ? 'border-red-400/50' : 'border-white/20'
                }`}
              >
                <option value="" className="bg-slate-800 text-white">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id} className="bg-slate-800 text-white">
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
              {errors.client_id && (
                <p className="mt-1 text-sm text-red-400">{errors.client_id}</p>
              )}
              <p className="mt-1 text-sm text-blue-200">
                Don't see your client? <Link to="/clients/new" className="text-blue-300 hover:text-blue-100">Create a new client</Link>
              </p>
            </div>

            {selectedClient && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                    {selectedClient.first_name.charAt(0)}{selectedClient.last_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {selectedClient.first_name} {selectedClient.last_name}
                    </p>
                    <p className="text-sm text-blue-200">{selectedClient.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Case Details */}
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center mb-4">
            <FolderOpen className="h-5 w-5 text-green-300 mr-2" />
            <h3 className="text-lg font-semibold text-white">Case Details</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Matter Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., State v. Smith - DUI Defense"
                className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 focus:text-white transition-all duration-200 ${
                  errors.title ? 'border-red-400/50' : 'border-white/20'
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Practice Area *
              </label>
              <select
                value={formData.practice_area}
                onChange={(e) => setFormData({ ...formData, practice_area: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 focus:text-white transition-all duration-200 ${
                  errors.practice_area ? 'border-red-400/50' : 'border-white/20'
                }`}
              >
                <option value="" className="bg-slate-800 text-white">Select practice area...</option>
                <option value="Criminal" className="bg-slate-800 text-white">Criminal Defense</option>
                <option value="PersonalInjury" className="bg-slate-800 text-white">Personal Injury</option>
                <option value="SSD" className="bg-slate-800 text-white">Social Security Disability</option>
              </select>
              {errors.practice_area && (
                <p className="mt-1 text-sm text-red-400">{errors.practice_area}</p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Case Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Brief description of the case..."
                className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 focus:text-white transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Fee Structure */}
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="h-5 w-5 text-yellow-300 mr-2" />
            <h3 className="text-lg font-semibold text-white">Fee Structure</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-3">
                Fee Model *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    type="radio"
                    name="fee_model"
                    value="FlatRate"
                    checked={formData.fee_model === 'FlatRate'}
                    onChange={(e) => setFormData({ ...formData, fee_model: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.fee_model === 'FlatRate'
                      ? 'border-blue-400/50 bg-blue-500/20'
                      : 'border-white/20 hover:border-white/30 bg-white/5'
                  }`}>
                    <h4 className="font-medium text-white">Flat Rate</h4>
                    <p className="text-sm text-blue-200">Fixed fee for the entire matter</p>
                  </div>
                </label>

                <label className="relative">
                  <input
                    type="radio"
                    name="fee_model"
                    value="Progressive"
                    checked={formData.fee_model === 'Progressive'}
                    onChange={(e) => setFormData({ ...formData, fee_model: e.target.value })}
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    formData.fee_model === 'Progressive'
                      ? 'border-blue-400/50 bg-blue-500/20'
                      : 'border-white/20 hover:border-white/30 bg-white/5'
                  }`}>
                    <h4 className="font-medium text-white">Progressive Billing</h4>
                    <p className="text-sm text-blue-200">Hourly billing with time tracking</p>
                  </div>
                </label>
              </div>
            </div>

            {formData.fee_model === 'FlatRate' && (
              <div>
                <label className="block text-sm font-medium text-blue-200 mb-1">
                  Flat Rate Amount *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-blue-200 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.flat_rate_amount}
                    onChange={(e) => setFormData({ ...formData, flat_rate_amount: e.target.value })}
                    placeholder="0.00"
                    className={`w-full pl-7 pr-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 focus:text-white transition-all duration-200 ${
                      errors.flat_rate_amount ? 'border-red-400/50' : 'border-white/20'
                    }`}
                  />
                </div>
                {errors.flat_rate_amount && (
                  <p className="mt-1 text-sm text-red-400">{errors.flat_rate_amount}</p>
                )}
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
            to="/matters"
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
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Matter
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
