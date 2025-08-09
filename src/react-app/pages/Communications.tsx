import { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MessageCircle,
  User,
  Clock,
  FolderOpen,
  Send,
  Archive,
  Star,
  Filter,
  Eye,
  Reply,
  Forward,
  Trash2
} from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

interface Communication {
  id: number;
  matter_id: number;
  channel: 'SMS' | 'Email' | 'Phone' | 'Portal';
  direction: 'Inbound' | 'Outbound';
  to_address?: string;
  from_address?: string;
  body?: string;
  sent_at: string;
  created_at: string;
  matter_title?: string;
  client_name?: string;
  meta?: any;
}

interface Matter {
  id: number;
  title: string;
  matter_number: string;
  client_first_name: string;
  client_last_name: string;
}

export default function Communications() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState('all');
  const [matterFilter, setMatterFilter] = useState('all');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);

  useEffect(() => {
    fetchCommunications();
    fetchMatters();
  }, []);

  const fetchCommunications = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.communications, []);
      setCommunications((list.documents || []) as unknown as Communication[]);
    } catch (error) {
      console.error('Error fetching communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatters = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, 'matters', []);
      setMatters((list.documents || []) as unknown as Matter[]);
    } catch (error) {
      console.error('Error fetching matters:', error);
    }
  };

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = 
      comm.body?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.matter_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.to_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.from_address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChannel = channelFilter === 'all' || comm.channel === channelFilter;
    const matchesDirection = directionFilter === 'all' || comm.direction === directionFilter;
    const matchesMatter = matterFilter === 'all' || comm.matter_id.toString() === matterFilter;
    
    return matchesSearch && matchesChannel && matchesDirection && matchesMatter;
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Email': return Mail;
      case 'Phone': return Phone;
      case 'SMS': return MessageCircle;
      case 'Portal': return MessageSquare;
      default: return MessageSquare;
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case 'Email': return 'bg-blue-100 text-blue-600';
      case 'Phone': return 'bg-green-100 text-green-600';
      case 'SMS': return 'bg-purple-100 text-purple-600';
      case 'Portal': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'Inbound' 
      ? 'bg-blue-50 border-l-4 border-l-blue-500' 
      : 'bg-green-50 border-l-4 border-l-green-500';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600">Track all client communications across channels</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCompose(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Communication
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Channels</option>
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
            <option value="SMS">SMS</option>
            <option value="Portal">Portal</option>
          </select>

          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Directions</option>
            <option value="Inbound">Inbound</option>
            <option value="Outbound">Outbound</option>
          </select>

          <select
            value={matterFilter}
            onChange={(e) => setMatterFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Matters</option>
            {matters.map(matter => (
              <option key={matter.id} value={matter.id}>
                {matter.title} - {matter.client_first_name} {matter.client_last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Communications ({filteredCommunications.length})
            </h3>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Filter className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Archive className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredCommunications.length > 0 ? (
            filteredCommunications.map((comm) => {
              const ChannelIcon = getChannelIcon(comm.channel);
              
              return (
                <div
                  key={comm.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer ${getDirectionColor(comm.direction)}`}
                  onClick={() => setSelectedComm(comm)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getChannelColor(comm.channel)}`}>
                      <ChannelIcon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            comm.direction === 'Inbound' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {comm.direction}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {comm.direction === 'Inbound' ? comm.from_address : comm.to_address}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {new Date(comm.sent_at || comm.created_at).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-2">
                        {comm.matter_title && (
                          <div className="flex items-center text-xs text-gray-500">
                            <FolderOpen className="w-3 h-3 mr-1" />
                            {comm.matter_title}
                          </div>
                        )}
                        {comm.client_name && (
                          <div className="flex items-center text-xs text-gray-500">
                            <User className="w-3 h-3 mr-1" />
                            {comm.client_name}
                          </div>
                        )}
                      </div>
                      
                      {comm.body && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {comm.body}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle star
                        }}
                        className="p-1 text-gray-400 hover:text-yellow-500"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedComm(comm);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No communications found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start tracking communications with your clients.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCompose(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Communication
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Communication Detail Modal */}
      {selectedComm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getChannelColor(selectedComm.channel)}`}>
                    {(() => {
                      const Icon = getChannelIcon(selectedComm.channel);
                      return <Icon className="w-4 h-4" />;
                    })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedComm.channel} Communication
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedComm.direction} • {new Date(selectedComm.sent_at || selectedComm.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedComm(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">From</label>
                    <p className="text-sm text-gray-900">{selectedComm.from_address || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">To</label>
                    <p className="text-sm text-gray-900">{selectedComm.to_address || 'N/A'}</p>
                  </div>
                </div>
                
                {selectedComm.matter_title && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Matter</label>
                    <p className="text-sm text-gray-900">{selectedComm.matter_title}</p>
                  </div>
                )}
                
                {selectedComm.body && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedComm.body}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 p-6">
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => alert('Reply functionality would be implemented here')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Reply className="mr-2 h-4 w-4" />
                  Reply
                </button>
                <button
                  onClick={() => alert('Forward functionality would be implemented here')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Forward className="mr-2 h-4 w-4" />
                  Forward
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this communication?')) {
                      // Delete functionality
                      setSelectedComm(null);
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Communication Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">New Communication</h3>
                <button
                  onClick={() => setShowCompose(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
            
            <NewCommunicationForm
              matters={matters}
              onSave={(comm) => {
                setCommunications([comm, ...communications]);
                setShowCompose(false);
              }}
              onCancel={() => setShowCompose(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// New Communication Form Component
function NewCommunicationForm({ 
  matters, 
  onSave, 
  onCancel 
}: { 
  matters: Matter[];
  onSave: (comm: Communication) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    matter_id: '',
    channel: 'Email' as 'SMS' | 'Email' | 'Phone' | 'Portal',
    direction: 'Outbound' as 'Inbound' | 'Outbound',
    to_address: '',
    from_address: '',
    body: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.matter_id) newErrors.matter_id = 'Matter is required';
    if (!formData.body.trim()) newErrors.body = 'Message is required';
    if (formData.direction === 'Outbound' && !formData.to_address.trim()) {
      newErrors.to_address = 'Recipient is required for outbound communications';
    }
    if (formData.direction === 'Inbound' && !formData.from_address.trim()) {
      newErrors.from_address = 'Sender is required for inbound communications';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const created = await databases.createDocument(DATABASE_ID, COLLECTIONS.communications, 'unique()', {
        ...formData,
        matter_id: parseInt(formData.matter_id),
        sent_at: new Date().toISOString(),
      });
      onSave(created as any);
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Matter *
          </label>
          <select
            value={formData.matter_id}
            onChange={(e) => setFormData({ ...formData, matter_id: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.matter_id ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select a matter...</option>
            {matters.map((matter) => (
              <option key={matter.id} value={matter.id}>
                {matter.title} - {matter.client_first_name} {matter.client_last_name}
              </option>
            ))}
          </select>
          {errors.matter_id && (
            <p className="mt-1 text-sm text-red-600">{errors.matter_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Channel
          </label>
          <select
            value={formData.channel}
            onChange={(e) => setFormData({ ...formData, channel: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
            <option value="SMS">SMS</option>
            <option value="Portal">Portal</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Direction
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="Inbound"
              checked={formData.direction === 'Inbound'}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value as any })}
              className="mr-2"
            />
            Inbound (Received)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="Outbound"
              checked={formData.direction === 'Outbound'}
              onChange={(e) => setFormData({ ...formData, direction: e.target.value as any })}
              className="mr-2"
            />
            Outbound (Sent)
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formData.direction === 'Outbound' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To *
            </label>
            <input
              type="text"
              value={formData.to_address}
              onChange={(e) => setFormData({ ...formData, to_address: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.to_address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Recipient address/number"
            />
            {errors.to_address && (
              <p className="mt-1 text-sm text-red-600">{errors.to_address}</p>
            )}
          </div>
        )}

        {formData.direction === 'Inbound' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From *
            </label>
            <input
              type="text"
              value={formData.from_address}
              onChange={(e) => setFormData({ ...formData, from_address: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.from_address ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Sender address/number"
            />
            {errors.from_address && (
              <p className="mt-1 text-sm text-red-600">{errors.from_address}</p>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message *
        </label>
        <textarea
          value={formData.body}
          onChange={(e) => setFormData({ ...formData, body: e.target.value })}
          rows={6}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            errors.body ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter the communication content..."
        />
        {errors.body && (
          <p className="mt-1 text-sm text-red-600">{errors.body}</p>
        )}
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
              Saving...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Save Communication
            </>
          )}
        </button>
      </div>
    </form>
  );
}
