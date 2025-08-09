import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { 
  ArrowLeft, 
  Edit, 
  Save,
  DollarSign,
  FileText,
  Stethoscope,
  Car,
  Building
} from 'lucide-react';

export default function PersonalInjury() {
  const { id } = useParams();
  const [matter, setMatter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const response = await fetch(`/api/matters/${id}/personal-injury`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setMatter(data.matter);
        setFormData({
          incident_date: data.personal_injury_case?.incident_date || '',
          incident_type: data.personal_injury_case?.incident_type || '',
          injuries: data.personal_injury_case?.injuries ? JSON.parse(data.personal_injury_case.injuries) : [],
          providers: data.personal_injury_case?.providers ? JSON.parse(data.personal_injury_case.providers) : [],
          policy_limits: data.personal_injury_case?.policy_limits || '',
          demand_amount: data.personal_injury_case?.demand_amount || '',
          settlement_amount: data.personal_injury_case?.settlement_amount || '',
          liens: data.personal_injury_case?.liens ? JSON.parse(data.personal_injury_case.liens) : [],
          med_bills_total: data.personal_injury_case?.med_bills_total || '',
          lost_wages_total: data.personal_injury_case?.lost_wages_total || '',
        });
      }
    } catch (error) {
      console.error('Error fetching PI case data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveData = async () => {
    try {
      const response = await fetch(`/api/matters/${id}/personal-injury`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          injuries: JSON.stringify(formData.injuries.filter((i: string) => i.trim())),
          providers: JSON.stringify(formData.providers),
          liens: JSON.stringify(formData.liens),
        }),
      });
      if (response.ok) {
        setIsEditing(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving PI case data:', error);
    }
  };

  const addInjury = () => {
    setFormData({
      ...formData,
      injuries: [...formData.injuries, '']
    });
  };

  const updateInjury = (index: number, value: string) => {
    const newInjuries = [...formData.injuries];
    newInjuries[index] = value;
    setFormData({
      ...formData,
      injuries: newInjuries
    });
  };

  const removeInjury = (index: number) => {
    setFormData({
      ...formData,
      injuries: formData.injuries.filter((_: any, i: number) => i !== index)
    });
  };

  const addProvider = () => {
    setFormData({
      ...formData,
      providers: [...formData.providers, {
        name: '',
        type: '',
        address: '',
        phone: '',
        specialty: ''
      }]
    });
  };

  const updateProvider = (index: number, field: string, value: string) => {
    const newProviders = [...formData.providers];
    newProviders[index] = {
      ...newProviders[index],
      [field]: value
    };
    setFormData({
      ...formData,
      providers: newProviders
    });
  };

  const removeProvider = (index: number) => {
    setFormData({
      ...formData,
      providers: formData.providers.filter((_: any, i: number) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/matters" className="p-2 hover:bg-gray-100 rounded-lg">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to={`/matters/${id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personal Injury Case</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-gray-500">{matter.title}</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Personal Injury
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing && (
            <button
              onClick={saveData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </button>
          )}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Edit className="mr-2 h-4 w-4" />
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
        </div>
      </div>

      {/* Case Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incident Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Car className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Incident Details</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {formData.incident_date ? new Date(formData.incident_date).toLocaleDateString() : 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Incident Type</label>
              {isEditing ? (
                <select
                  value={formData.incident_type}
                  onChange={(e) => setFormData({...formData, incident_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  <option value="Motor Vehicle Accident">Motor Vehicle Accident</option>
                  <option value="Slip and Fall">Slip and Fall</option>
                  <option value="Workplace Injury">Workplace Injury</option>
                  <option value="Medical Malpractice">Medical Malpractice</option>
                  <option value="Product Liability">Product Liability</option>
                  <option value="Premises Liability">Premises Liability</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900">{formData.incident_type || 'Not specified'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Financial Summary</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policy Limits</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.policy_limits}
                  onChange={(e) => setFormData({...formData, policy_limits: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {formData.policy_limits ? `$${Number(formData.policy_limits).toLocaleString()}` : 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Demand Amount</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.demand_amount}
                  onChange={(e) => setFormData({...formData, demand_amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {formData.demand_amount ? `$${Number(formData.demand_amount).toLocaleString()}` : 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Settlement Amount</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.settlement_amount}
                  onChange={(e) => setFormData({...formData, settlement_amount: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {formData.settlement_amount ? `$${Number(formData.settlement_amount).toLocaleString()}` : 'Not settled'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Damages Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FileText className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Damages</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical Bills Total</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.med_bills_total}
                  onChange={(e) => setFormData({...formData, med_bills_total: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {formData.med_bills_total ? `$${Number(formData.med_bills_total).toLocaleString()}` : 'Not specified'}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lost Wages Total</label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.lost_wages_total}
                  onChange={(e) => setFormData({...formData, lost_wages_total: e.target.value})}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <p className="text-sm text-gray-900">
                  {formData.lost_wages_total ? `$${Number(formData.lost_wages_total).toLocaleString()}` : 'Not specified'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Injuries */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Stethoscope className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Injuries</h3>
          </div>
          {isEditing && (
            <button
              onClick={addInjury}
              className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 rounded-lg"
            >
              Add Injury
            </button>
          )}
        </div>
        <div className="space-y-3">
          {formData.injuries.length === 0 ? (
            <p className="text-sm text-gray-500">No injuries documented</p>
          ) : (
            formData.injuries.map((injury: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={injury}
                      onChange={(e) => updateInjury(index, e.target.value)}
                      placeholder="Describe injury..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeInjury(index)}
                      className="px-2 py-1 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-gray-900">• {injury}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Medical Providers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Building className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Medical Providers</h3>
          </div>
          {isEditing && (
            <button
              onClick={addProvider}
              className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 bg-white hover:bg-blue-50 rounded-lg"
            >
              Add Provider
            </button>
          )}
        </div>
        <div className="space-y-6">
          {formData.providers.length === 0 ? (
            <p className="text-sm text-gray-500">No medical providers documented</p>
          ) : (
            formData.providers.map((provider: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Provider Name</label>
                      <input
                        type="text"
                        value={provider.name || ''}
                        onChange={(e) => updateProvider(index, 'name', e.target.value)}
                        placeholder="Provider name..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={provider.type || ''}
                        onChange={(e) => updateProvider(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select type...</option>
                        <option value="Hospital">Hospital</option>
                        <option value="Physician">Physician</option>
                        <option value="Specialist">Specialist</option>
                        <option value="Physical Therapist">Physical Therapist</option>
                        <option value="Chiropractor">Chiropractor</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Specialty</label>
                      <input
                        type="text"
                        value={provider.specialty || ''}
                        onChange={(e) => updateProvider(index, 'specialty', e.target.value)}
                        placeholder="Specialty..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={provider.phone || ''}
                        onChange={(e) => updateProvider(index, 'phone', e.target.value)}
                        placeholder="Phone number..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        value={provider.address || ''}
                        onChange={(e) => updateProvider(index, 'address', e.target.value)}
                        placeholder="Address..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        onClick={() => removeProvider(index)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Provider
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h4 className="font-medium text-gray-900">{provider.name}</h4>
                    <div className="mt-1 text-sm text-gray-600 space-y-1">
                      {provider.type && <p>Type: {provider.type}</p>}
                      {provider.specialty && <p>Specialty: {provider.specialty}</p>}
                      {provider.phone && <p>Phone: {provider.phone}</p>}
                      {provider.address && <p>Address: {provider.address}</p>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
