import { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/react-app/auth/AuthProvider";
import { 
  User, 
  Bell, 
  Shield, 
  Briefcase, 
  Save, 
  Mail,
  Phone,
  Settings as SettingsIcon,
  Palette,
  Users,
  Edit,
  Trash2,
  UserPlus,
  Search
} from 'lucide-react';

import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/backend';
import { Query } from '@/react-app/lib/backend';

interface UserProfile {
  id?: string;
  first_name: string;
  last_name: string;
  role: RoleOption;
  bar_number: string;
  practice_areas: string[];
  phone: string;
}

type RoleOption = 'Admin' | 'Attorney' | 'Staff' | 'Client';

interface UserManagement {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  role: RoleOption;
  bar_number: string;
  practice_areas: string[];
  phone: string;
  is_active: boolean;
  email?: string;
  created_at: string;
  updated_at: string;
}

type ThemeOption = 'light' | 'dark' | 'system';
type DensityOption = 'compact' | 'comfortable' | 'spacious';

interface Preferences {
  notifications: {
    email_deadlines: boolean;
    email_hearings: boolean;
    email_new_messages: boolean;
    sms_urgent_deadlines: boolean;
    desktop_notifications: boolean;
  };
  appearance: {
    theme: ThemeOption;
    sidebar_collapsed: boolean;
    density: DensityOption;
  };
  practice: {
    default_practice_area: string;
    auto_generate_matter_numbers: boolean;
    default_hourly_rate: number;
    require_time_entry_descriptions: boolean;
    default_invoice_due_days: number;
  };
}

interface UserProfileDoc {
  $id: string;
  user_id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: RoleOption;
  bar_number?: string;
  practice_areas?: string; // JSON string in DB
  phone?: string;
  is_active?: boolean;
  preferences?: string; // JSON string in DB
  created_at?: string;
  updated_at?: string;
  $createdAt?: string;
  $updatedAt?: string;
}

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [users, setUsers] = useState<UserManagement[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserManagement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserManagement | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    first_name: '',
    last_name: '',
    role: 'Attorney',
    bar_number: '',
    practice_areas: [],
    phone: '',
  });

  const [preferences, setPreferences] = useState<Preferences>({
    notifications: {
      email_deadlines: true,
      email_hearings: true,
      email_new_messages: true,
      sms_urgent_deadlines: true,
      desktop_notifications: true,
    },
    appearance: {
      theme: 'system',
      sidebar_collapsed: false,
      density: 'comfortable',
    },
    practice: {
      default_practice_area: '',
      auto_generate_matter_numbers: true,
      default_hourly_rate: 400,
      require_time_entry_descriptions: true,
      default_invoice_due_days: 30,
    }
  });


  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    try {
      // Find by Appwrite account user_id first, then by email
      const byUserId = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.userProfiles,
        [Query.equal('user_id', user.$id)]
      );

      let doc = byUserId.documents[0] as unknown as UserProfileDoc | undefined;

      if (!doc && user?.email) {
        const byEmail = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.userProfiles,
          [Query.equal('email', user.email)]
        );
        doc = byEmail.documents[0] as unknown as UserProfileDoc | undefined;
      }

      if (!doc) {
        // Create a baseline profile linked to this Appwrite account
        const name = user?.name || '';
        const first = name ? name.split(' ')[0] : '';
        const last = name ? name.split(' ').slice(1).join(' ') : '';
        doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.userProfiles,
          'unique()',
          {
            user_id: user.$id,
            email: user?.email || null,
            first_name: first,
            last_name: last,
            role: 'Attorney',
            bar_number: '',
            practice_areas: JSON.stringify([]),
            phone: '',
            is_active: true,
            preferences: JSON.stringify(preferences),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ) as unknown as UserProfileDoc;
      }

      const docSafe = doc as UserProfileDoc;
      setProfile({
        id: docSafe.$id,
        first_name: docSafe.first_name || '',
        last_name: docSafe.last_name || '',
        role: (docSafe.role as RoleOption) || 'Attorney',
        bar_number: docSafe.bar_number || '',
        practice_areas: docSafe.practice_areas ? JSON.parse(docSafe.practice_areas) : [],
        phone: docSafe.phone || '',
      });

      const prefsRaw = docSafe.preferences as unknown as string | null | undefined;
      if (prefsRaw) {
        try {
          setPreferences(JSON.parse(prefsRaw as string));
        } catch (err) {
          console.warn('Failed to parse stored preferences JSON; using defaults', err);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [user, preferences]);

  const saveProfile = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');
      const payload: Partial<UserProfileDoc> & { practice_areas: string } = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        bar_number: profile.bar_number,
        practice_areas: JSON.stringify(profile.practice_areas || []),
        phone: profile.phone,
        updated_at: new Date().toISOString(),
      };

      let doc: UserProfileDoc;
      if (profile.id) {
        doc = await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.userProfiles,
          profile.id,
          payload
        ) as unknown as UserProfileDoc;
      } else {
        doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.userProfiles,
          'unique()',
          {
            ...payload,
            user_id: user.$id,
            email: user?.email || null,
            is_active: true,
            preferences: JSON.stringify(preferences),
            created_at: new Date().toISOString(),
          }
        ) as unknown as UserProfileDoc;
      }

      setProfile(prev => ({ ...prev, id: doc.$id }));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      if (!user) throw new Error('Not authenticated');
      if (profile.id) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.userProfiles,
          profile.id,
          {
            preferences: JSON.stringify(preferences),
            updated_at: new Date().toISOString(),
          }
        );
      } else {
        const created = await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.userProfiles,
          'unique()',
          {
            user_id: user.$id,
            email: user?.email || null,
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            role: profile.role || 'Attorney',
            bar_number: profile.bar_number || '',
            practice_areas: JSON.stringify(profile.practice_areas || []),
            phone: profile.phone || '',
            is_active: true,
            preferences: JSON.stringify(preferences),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        ) as unknown as UserProfileDoc;
        setProfile(prev => ({ ...prev, id: created.$id }));
      }
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.userProfiles
      );
      const docs = res.documents as unknown as UserProfileDoc[];
      const mapped: UserManagement[] = docs.map((d) => ({
        id: d.$id,
        user_id: d.user_id || '',
        first_name: d.first_name || '',
        last_name: d.last_name || '',
        role: (d.role as RoleOption) || 'Staff',
        bar_number: d.bar_number || '',
        practice_areas: d.practice_areas ? JSON.parse(d.practice_areas) : [],
        phone: d.phone || '',
        is_active: typeof d.is_active === 'boolean' ? d.is_active : true,
        email: d.email || undefined,
        created_at: d.created_at || d.$createdAt || '',
        updated_at: d.updated_at || d.$updatedAt || '',
      }));
      setUsers(mapped);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  // Effects (placed after callbacks to avoid use-before-assign issues)
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user, fetchUserProfile]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, fetchUsers]);

  useEffect(() => {
    // Pre-populate form with Google account data when user is available
    if (user && !profile.first_name && !profile.last_name) {
      const name = user?.name || '';
      const first = name ? name.split(' ')[0] : '';
      const last = name ? name.split(' ').slice(1).join(' ') : '';
      setProfile(prev => ({
        ...prev,
        first_name: first,
        last_name: last,
      }));
    }
  }, [user, profile.first_name, profile.last_name]);

  useEffect(() => {
    // Filter users based on search term and role
    const filtered = users.filter(user => {
      const matchesSearch = 
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesRole = selectedRole === 'all' || user.role === selectedRole;
      
      return matchesSearch && matchesRole;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedRole]);

  const saveUser = async (userData: Partial<UserManagement>) => {
    setLoading(true);
    try {
      const payload: Partial<UserProfileDoc> & { practice_areas: string } = {
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        role: userData.role ?? 'Staff',
        bar_number: userData.bar_number || '',
        phone: userData.phone || '',
        is_active: userData.is_active !== undefined ? userData.is_active : true,
        practice_areas: JSON.stringify(userData.practice_areas || []),
        updated_at: new Date().toISOString(),
      };

      if (editingUser?.id) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.userProfiles,
          editingUser.id,
          payload
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.userProfiles,
          'unique()',
          {
            ...payload,
            email: userData.email || null,
            user_id: userData.user_id || null,
            created_at: new Date().toISOString(),
          }
        );
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setShowUserModal(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.userProfiles,
        userId
      );
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.userProfiles,
        userId,
        { is_active: !isActive, updated_at: new Date().toISOString() }
      );
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const addPracticeArea = (area: string) => {
    if (area && !profile.practice_areas.includes(area)) {
      setProfile({
        ...profile,
        practice_areas: [...profile.practice_areas, area]
      });
    }
  };

  const removePracticeArea = (area: string) => {
    setProfile({
      ...profile,
      practice_areas: profile.practice_areas.filter(a => a !== area)
    });
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'practice', name: 'Practice', icon: Briefcase },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Shield },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center">
          <SettingsIcon className="mr-3 h-6 w-6 text-blue-300" />
          Settings
        </h1>
        <p className="text-blue-200">Manage your account and application preferences</p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center">
            <div className="w-5 h-5 rounded-full bg-green-400/30 flex items-center justify-center mr-3">
              <div className="w-2 h-2 bg-green-300 rounded-full"></div>
            </div>
            <p className="text-sm text-green-200 font-medium">Settings saved successfully!</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64">
          <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-blue-100 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`mr-3 h-4 w-4 ${
                      activeTab === tab.id ? 'text-white' : 'text-blue-300'
                    }`} />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <User className="h-5 w-5 text-blue-300 mr-2" />
                  <h2 className="text-lg font-semibold text-white">Profile Information</h2>
                </div>

                <div className="space-y-6">
                  {/* Current User Info */}
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                    <div className="flex items-center space-x-4">
                      <img
                        className="w-16 h-16 rounded-xl shadow-md"
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=3b82f6&color=fff&size=64`}
                        alt="Profile"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || user?.email || 'User')}&background=3b82f6&color=fff&size=64`;
                        }}
                      />
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {user?.name || user?.email || 'User'}
                        </h3>
                        <p className="text-sm text-blue-200">{user?.email || ''}</p>
                        <p className="text-xs text-blue-300 font-medium">Appwrite Account</p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Form Hint */}
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-start">
                      <div className="w-5 h-5 rounded-full bg-blue-400/30 flex items-center justify-center mr-3 mt-0.5">
                        <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-blue-200 mb-1">Google Account Integration</h3>
                        <p className="text-sm text-blue-300">
                          Your profile has been pre-populated with information from your Google account. You can edit these fields below and add additional practice information.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profile.first_name || (user?.name ? user.name.split(' ')[0] : '')}
                        onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                        placeholder={(user?.name ? user.name.split(' ')[0] : '') || 'Enter first name'}
                        aria-label="First Name"
                        title="First Name"
                        className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profile.last_name || (user?.name ? user.name.split(' ').slice(1).join(' ') : '')}
                        onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                        placeholder={(user?.name ? user.name.split(' ').slice(1).join(' ') : '') || 'Enter last name'}
                        aria-label="Last Name"
                        title="Last Name"
                        className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Role
                      </label>
                      <select
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value as RoleOption })}
                        aria-label="Role"
                        title="Role"
                        className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                      >
                        <option value="Attorney">Attorney</option>
                        <option value="Staff">Staff</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Bar Number
                      </label>
                      <input
                        type="text"
                        value={profile.bar_number}
                        onChange={(e) => setProfile({ ...profile, bar_number: e.target.value })}
                        placeholder="e.g., 12345"
                        aria-label="Bar Number"
                        title="Bar Number"
                        className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-blue-200 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Enter phone number"
                        aria-label="Phone Number"
                        title="Phone Number"
                        className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-2">
                      Practice Areas
                    </label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {profile.practice_areas.map((area) => (
                        <span
                          key={area}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {area}
                          <button
                            onClick={() => removePracticeArea(area)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            addPracticeArea(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        aria-label="Add practice area"
                        title="Add practice area"
                        className="px-4 py-2 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                      >
                        <option value="">Add practice area...</option>
                        <option value="Criminal Defense">Criminal Defense</option>
                        <option value="Personal Injury">Personal Injury</option>
                        <option value="Social Security Disability">Social Security Disability</option>
                        <option value="Family Law">Family Law</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Corporate Law">Corporate Law</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={saveProfile}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Profile
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Practice Tab */}
            {activeTab === 'practice' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <Briefcase className="h-5 w-5 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Practice Settings</h2>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Practice Area
                      </label>
                      <select
                        value={preferences.practice.default_practice_area}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          practice: {
                            ...preferences.practice,
                            default_practice_area: e.target.value
                          }
                        })}
                        aria-label="Default Practice Area"
                        title="Default Practice Area"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                      >
                        <option value="">Select default...</option>
                        <option value="Criminal">Criminal Defense</option>
                        <option value="PersonalInjury">Personal Injury</option>
                        <option value="SSD">Social Security Disability</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Hourly Rate
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500">$</span>
                        </div>
                        <input
                          type="number"
                          value={preferences.practice.default_hourly_rate}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            practice: {
                              ...preferences.practice,
                              default_hourly_rate: parseInt(e.target.value) || 0
                            }
                          })}
                          aria-label="Default Hourly Rate"
                          title="Default Hourly Rate"
                          className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Invoice Due Days
                      </label>
                      <input
                        type="number"
                        value={preferences.practice.default_invoice_due_days}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          practice: {
                            ...preferences.practice,
                            default_invoice_due_days: parseInt(e.target.value) || 30
                          }
                        })}
                        aria-label="Invoice Due Days"
                        title="Invoice Due Days"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Auto-generate Matter Numbers</h4>
                        <p className="text-sm text-gray-500">Automatically create sequential matter numbers</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.practice.auto_generate_matter_numbers}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            practice: {
                              ...preferences.practice,
                              auto_generate_matter_numbers: e.target.checked
                            }
                          })}
                          aria-label="Auto-generate Matter Numbers"
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          preferences.practice.auto_generate_matter_numbers ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                            preferences.practice.auto_generate_matter_numbers ? 'translate-x-6' : 'translate-x-1'
                          } mt-1`}></div>
                        </div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">Require Time Entry Descriptions</h4>
                        <p className="text-sm text-gray-500">Force users to add descriptions for all time entries</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={preferences.practice.require_time_entry_descriptions}
                          onChange={(e) => setPreferences({
                            ...preferences,
                            practice: {
                              ...preferences.practice,
                              require_time_entry_descriptions: e.target.checked
                            }
                          })}
                          aria-label="Require Time Entry Descriptions"
                          className="sr-only"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors ${
                          preferences.practice.require_time_entry_descriptions ? 'bg-blue-600' : 'bg-gray-300'
                        }`}>
                          <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                            preferences.practice.require_time_entry_descriptions ? 'translate-x-6' : 'translate-x-1'
                          } mt-1`}></div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={savePreferences}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Settings
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <Bell className="h-5 w-5 text-yellow-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-blue-600" />
                      Email Notifications
                    </h3>
                    <div className="space-y-4">
                      {[
                        { key: 'email_deadlines', label: 'Deadline Reminders', desc: 'Get notified about upcoming deadlines' },
                        { key: 'email_hearings', label: 'Hearing Reminders', desc: 'Court hearing and appointment reminders' },
                        { key: 'email_new_messages', label: 'New Messages', desc: 'Client portal messages and communications' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{label}</h4>
                            <p className="text-sm text-gray-500">{desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={preferences.notifications[key as keyof typeof preferences.notifications]}
                              onChange={(e) => setPreferences({
                                ...preferences,
                                notifications: {
                                  ...preferences.notifications,
                                  [key]: e.target.checked
                                }
                              })}
                              aria-label={label}
                              title={label}
                              className="sr-only"
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              preferences.notifications[key as keyof typeof preferences.notifications] ? 'bg-blue-600' : 'bg-gray-300'
                            }`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                                preferences.notifications[key as keyof typeof preferences.notifications] ? 'translate-x-6' : 'translate-x-1'
                              } mt-1`}></div>
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-green-600" />
                      SMS Notifications
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Urgent Deadlines</h4>
                          <p className="text-sm text-gray-500">Critical deadlines within 24 hours</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.notifications.sms_urgent_deadlines}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              notifications: {
                                ...preferences.notifications,
                                sms_urgent_deadlines: e.target.checked
                              }
                            })}
                            aria-label="SMS Urgent Deadlines"
                            title="SMS Urgent Deadlines"
                            className="sr-only"
                          />
                          <div className={`w-11 h-6 rounded-full transition-colors ${
                            preferences.notifications.sms_urgent_deadlines ? 'bg-blue-600' : 'bg-gray-300'
                          }`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                              preferences.notifications.sms_urgent_deadlines ? 'translate-x-6' : 'translate-x-1'
                            } mt-1`}></div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={savePreferences}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Preferences
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <Palette className="h-5 w-5 text-purple-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Appearance</h2>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Theme Preference
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: 'Light', icon: '☀️' },
                        { value: 'dark', label: 'Dark', icon: '🌙' },
                        { value: 'system', label: 'System', icon: '💻' },
                      ].map(({ value, label, icon }) => (
                        <label key={value} className="relative">
                          <input
                            type="radio"
                            name="theme"
                            value={value}
                            checked={preferences.appearance.theme === value}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              appearance: {
                                ...preferences.appearance,
                                theme: e.target.value as ThemeOption
                              }
                            })}
                            aria-label={label}
                            className="sr-only"
                          />
                          <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                            preferences.appearance.theme === value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="text-center">
                              <div className="text-2xl mb-2">{icon}</div>
                              <div className="text-sm font-medium text-gray-900">{label}</div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Interface Density
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'compact', label: 'Compact' },
                        { value: 'comfortable', label: 'Comfortable' },
                        { value: 'spacious', label: 'Spacious' },
                      ].map(({ value, label }) => (
                        <label key={value} className="relative">
                          <input
                            type="radio"
                            name="density"
                            value={value}
                            checked={preferences.appearance.density === value}
                            onChange={(e) => setPreferences({
                              ...preferences,
                              appearance: {
                                ...preferences.appearance,
                                density: e.target.value as DensityOption
                              }
                            })}
                            aria-label={label}
                            className="sr-only"
                          />
                          <div className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 text-center ${
                            preferences.appearance.density === value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}>
                            <div className="text-sm font-medium text-gray-900">{label}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={savePreferences}
                      disabled={loading}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Appearance
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-300 mr-2" />
                    <h2 className="text-lg font-semibold text-white">User Management</h2>
                  </div>
                  <button
                    onClick={() => {
                      setEditingUser(null);
                      setShowUserModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <div className="flex items-start">
                    <div className="w-5 h-5 rounded-full bg-blue-400/30 flex items-center justify-center mr-3 mt-0.5">
                      <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-200 mb-1">Google Authentication</h3>
                      <p className="text-sm text-blue-300">
                        This system uses Google OAuth for authentication. When you add a user here, you're creating a profile that will be linked when they first log in with their Google account. Users must use the same email address to sign in.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search users"
                        className="w-full pl-10 pr-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      aria-label="Filter by role"
                      title="Filter by role"
                      className="px-4 py-3 border border-white/20 rounded-xl bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
                    >
                      <option value="all">All Roles</option>
                      <option value="Admin">Admin</option>
                      <option value="Attorney">Attorney</option>
                      <option value="Staff">Staff</option>
                      <option value="Client">Client</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/20">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-blue-200 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/5 divide-y divide-white/10">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-white/10 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                    <span className="text-white font-medium text-sm">
                                      {user.first_name?.charAt(0) || '?'}{user.last_name?.charAt(0) || ''}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-white">
                                    {user.first_name} {user.last_name}
                                  </div>
                                  <div className="text-sm text-blue-200">
                                    {user.email || user.user_id}
                                  </div>
                                  {!user.first_name && !user.last_name && (
                                    <div className="text-xs text-yellow-300 mt-1">
                                      Profile incomplete - will be updated on first login
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'Admin' ? 'bg-red-100 text-red-800' :
                                user.role === 'Attorney' ? 'bg-blue-100 text-blue-800' :
                                user.role === 'Staff' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">{user.phone || '-'}</div>
                              <div className="text-sm text-blue-200">
                                {user.bar_number ? `Bar: ${user.bar_number}` : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={user.is_active}
                                  onChange={() => toggleUserStatus(user.id!, user.is_active)}
                                  aria-label="Toggle user status"
                                  className="sr-only"
                                />
                                <div className={`w-10 h-6 rounded-full transition-colors ${
                                  user.is_active ? 'bg-green-600' : 'bg-gray-300'
                                }`}>
                                  <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                                    user.is_active ? 'translate-x-5' : 'translate-x-1'
                                  } mt-1`}></div>
                                </div>
                                <span className="ml-2 text-sm text-blue-200">
                                  {user.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </label>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingUser(user);
                                    setShowUserModal(true);
                                  }}
                                  className="text-blue-300 hover:text-blue-100 p-1 hover:bg-blue-500/20 rounded transition-colors"
                                  title="Edit User"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteUser(user.id!)}
                                  className="text-red-300 hover:text-red-100 p-1 hover:bg-red-500/20 rounded transition-colors ml-1"
                                  title="Delete User"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-blue-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">No users found</h3>
                      <p className="mt-1 text-sm text-blue-200">
                        {searchTerm || selectedRole !== 'all' 
                          ? 'Try adjusting your search criteria.' 
                          : 'Get started by adding your first user.'
                        }
                      </p>
                      {!searchTerm && selectedRole === 'all' && (
                        <button
                          onClick={() => {
                            setEditingUser(null);
                            setShowUserModal(true);
                          }}
                          aria-label="Add first user"
                          title="Add first user"
                          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Add First User
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6">
                <div className="flex items-center mb-6">
                  <Shield className="h-5 w-5 text-red-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">Security & Privacy</h2>
                </div>

                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h3 className="text-sm font-medium text-blue-900">Google Account Integration</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Your account is secured through Google authentication. Security settings are managed through your Google account.
                        </p>
                        <a
                          href="https://myaccount.google.com/security"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800"
                        >
                          Manage Google Security Settings
                          <svg className="ml-1 w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Session Management</h3>
                    
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Current Session</h4>
                          <p className="text-sm text-gray-500">
                            Started: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900">Data & Privacy</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-500">Managed through your Google account</p>
                        </div>
                        <span className="text-sm text-gray-600">Google Managed</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Session Timeout</h4>
                          <p className="text-sm text-gray-500">Automatic logout after inactivity</p>
                        </div>
                        <span className="text-sm text-gray-600">24 hours</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-red-900 mb-2">Data Retention</h3>
                    <p className="text-sm text-red-700">
                      All case data, client information, and communications are retained according to legal requirements. 
                      Contact your administrator for data export or deletion requests.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Modal */}
      {showUserModal && <UserModal />}
    </div>
  );

  function UserModal() {
    const [formData, setFormData] = useState({
      first_name: editingUser?.first_name || '',
      last_name: editingUser?.last_name || '',
      email: editingUser?.email || '',
      role: editingUser?.role || 'Staff',
      bar_number: editingUser?.bar_number || '',
      phone: editingUser?.phone || '',
      practice_areas: editingUser?.practice_areas || [],
      is_active: editingUser?.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      saveUser(formData);
    };

    const addPracticeArea = (area: string) => {
      if (area && !formData.practice_areas.includes(area)) {
        setFormData({
          ...formData,
          practice_areas: [...formData.practice_areas, area]
        });
      }
    };

    const removePracticeArea = (area: string) => {
      setFormData({
        ...formData,
        practice_areas: formData.practice_areas.filter(a => a !== area)
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingUser ? 'Edit User Profile' : 'Add New User'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {editingUser 
                ? 'Update this user\'s profile information and permissions.' 
                : 'Create a profile for a user who will log in with their Google account.'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  aria-label="First name"
                  title="First name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  aria-label="Last name"
                  title="Last name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email * (Google Account)
                </label>
                <input
                  type="email"
                  required
                  aria-label="Email"
                  title="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                  placeholder="user@example.com"
                  disabled={!!editingUser}
                />
                {editingUser && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed after user creation</p>
                )}
                {!editingUser && (
                  <p className="text-xs text-gray-600 mt-1">This must match the email address the user will use to sign in with Google</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  required
                  aria-label="Role"
                  title="Role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as RoleOption })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                >
                  <option value="Admin">Admin</option>
                  <option value="Attorney">Attorney</option>
                  <option value="Staff">Staff</option>
                  <option value="Client">Client</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  aria-label="Phone number"
                  title="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bar Number
                </label>
                <input
                  type="text"
                  aria-label="Bar number"
                  title="Bar number"
                  value={formData.bar_number}
                  onChange={(e) => setFormData({ ...formData, bar_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Practice Areas
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.practice_areas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removePracticeArea(area)}
                      aria-label={`Remove ${area}`}
                      title={`Remove ${area}`}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addPracticeArea(e.target.value);
                    e.target.value = '';
                  }
                }}
                aria-label="Add practice area"
                title="Add practice area"
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-200"
              >
                <option value="">Add practice area...</option>
                <option value="Criminal Defense">Criminal Defense</option>
                <option value="Personal Injury">Personal Injury</option>
                <option value="Social Security Disability">Social Security Disability</option>
                <option value="Family Law">Family Law</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Corporate Law">Corporate Law</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  aria-label="Active user"
                  title="Active user"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active User
                </label>
              </div>
              <div className="text-xs text-gray-500">
                Inactive users cannot access the system
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowUserModal(false);
                  setEditingUser(null);
                }}
                className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingUser ? 'Update User' : 'Create User'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
