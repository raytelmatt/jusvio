import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Scale, Users, ArrowRight, Mail, Phone } from 'lucide-react';

export default function ClientPortalLogin() {
  const navigate = useNavigate();
  const [searchMethod, setSearchMethod] = useState<'email' | 'phone' | 'name'>('email');
  const [searchValue, setSearchValue] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchValue.trim()) return;

    setLoading(true);
    setError('');

    try {
      const searchParams = new URLSearchParams();
      searchParams.set('method', searchMethod);
      searchParams.set('value', searchValue);
      if (searchMethod === 'name' && lastName.trim()) {
        searchParams.set('lastName', lastName);
      }

      const response = await fetch(`/api/client-portal/lookup?${searchParams}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('No client found with that information. Please check your details or contact our office.');
          return;
        }
        throw new Error('Failed to search for client');
      }

      const client = await response.json();
      
      // Redirect to client portal
      navigate(`/client-portal/${client.id}`);
    } catch (error) {
      console.error('Error searching for client:', error);
      setError('An error occurred while searching. Please try again or contact our office.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="flex items-center justify-center min-h-screen p-4 relative z-10">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-b from-amber-200 via-amber-100 to-white rounded-2xl mb-6 shadow-2xl shadow-amber-500/20 border-2 border-amber-300/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-50/40 to-amber-200/20"></div>
                <Scale className="w-8 h-8 text-amber-800 relative z-10 drop-shadow-md" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2 logo-text">
                Client Portal Access
              </h1>
              <p className="text-blue-200 text-sm">
                Access your case information and documents
              </p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-100 mb-3">
                  Find your account using:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSearchMethod('email')}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
                      searchMethod === 'email'
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'bg-white/10 border-white/20 text-blue-200 hover:bg-white/15'
                    }`}
                  >
                    <Mail className="w-4 h-4 mb-1" />
                    <span className="text-xs">Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMethod('phone')}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
                      searchMethod === 'phone'
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'bg-white/10 border-white/20 text-blue-200 hover:bg-white/15'
                    }`}
                  >
                    <Phone className="w-4 h-4 mb-1" />
                    <span className="text-xs">Phone</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchMethod('name')}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
                      searchMethod === 'name'
                        ? 'bg-blue-500 border-blue-400 text-white'
                        : 'bg-white/10 border-white/20 text-blue-200 hover:bg-white/15'
                    }`}
                  >
                    <Users className="w-4 h-4 mb-1" />
                    <span className="text-xs">Name</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-100 mb-2">
                    {searchMethod === 'email' && 'Email Address'}
                    {searchMethod === 'phone' && 'Phone Number'}
                    {searchMethod === 'name' && 'First Name'}
                  </label>
                  <input
                    type={searchMethod === 'email' ? 'email' : 'text'}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={
                      searchMethod === 'email' ? 'Enter your email address' :
                      searchMethod === 'phone' ? 'Enter your phone number' :
                      'Enter your first name'
                    }
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
                    required
                  />
                </div>

                {searchMethod === 'name' && (
                  <div>
                    <label className="block text-sm font-medium text-blue-100 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter your last name"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
                      required
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !searchValue.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Access My Portal
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-4">
              <div className="border-t border-white/10 pt-4">
                <p className="text-blue-200 text-sm mb-2">
                  Need help accessing your portal?
                </p>
                <p className="text-blue-300 text-xs">
                  Call us at <strong>(555) 123-4567</strong> or email <strong>support@example.com</strong>
                </p>
              </div>
              <div className="pt-2">
                <a
                  href="/login"
                  className="text-blue-300 hover:text-white text-sm underline transition-colors"
                >
                  ← Back to Attorney Login
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
