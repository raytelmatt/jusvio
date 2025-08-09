import { useState } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, User, Phone, Mail, Users, Save, X } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

interface ClientFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_contact_method: 'Email' | 'Phone' | 'SMS' | '';
  date_of_birth: string;
  ssn_last4: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
  };
  emergency_contact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export default function NewClient() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    preferred_contact_method: '',
    date_of_birth: '',
    ssn_last4: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipcode: '',
    },
    emergency_contact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof ClientFormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email || null,
        phones: formData.phone ? JSON.stringify([formData.phone]) : null,
        preferred_contact_method: formData.preferred_contact_method || null,
        date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null,
        ssn_last4: formData.ssn_last4 || null,
        address: formData.address.street ? JSON.stringify(formData.address) : null,
        emergency_contact: formData.emergency_contact.name ? JSON.stringify(formData.emergency_contact) : null,
        notifications_opt_in: true,
        portal_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as any;

      const created = await databases.createDocument(
        DATABASE_ID,
        COLLECTIONS.clients,
        'unique()',
        submitData,
      );

      navigate(`/clients/${created.$id}`);
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error creating client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/clients')}
            className="p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">New Client</h1>
            <p className="text-blue-200 mt-1">Add a new client to your practice</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white/8 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-300" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  SSN (Last 4 digits)
                </label>
                <input
                  type="text"
                  name="ssn_last4"
                  value={formData.ssn_last4}
                  onChange={handleInputChange}
                  maxLength={4}
                  pattern="[0-9]{4}"
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="XXXX"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Phone className="w-5 h-5 mr-2 text-blue-300" />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Enter phone number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  name="preferred_contact_method"
                  value={formData.preferred_contact_method}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                >
                  <option value="">Select preferred method</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-300" />
              Address
            </h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Enter street address"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="address.state"
                    value={formData.address.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="address.zipcode"
                    value={formData.address.zipcode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-300" />
              Emergency Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  name="emergency_contact.name"
                  value={formData.emergency_contact.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Contact name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  name="emergency_contact.relationship"
                  value={formData.emergency_contact.relationship}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Relationship"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="emergency_contact.phone"
                  value={formData.emergency_contact.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                  placeholder="Contact phone"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate('/clients')}
              className="inline-flex items-center px-6 py-3 border border-white/20 text-sm font-semibold rounded-xl text-blue-100 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white/30 border-t-white rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create Client
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
