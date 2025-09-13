import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Edit, 
  Download, 
  Share2, 
  Clock, 
  User,
  FileText,
  Save,
  Eye,
  History,
  MessageSquare,
  Tag,
  FolderOpen,
  Copy,
  Trash2,
  Plus,
  RefreshCw
} from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/backend';
import { useAuth } from '@/react-app/auth/AuthProvider';
import { resolveDownloadUrl, resolveViewUrl } from '@/react-app/lib/storage-url';
import { Document, DocumentVersion, DocumentSchema, DocumentVersionSchema } from '@/shared/types';

export default function DocumentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [document, setDocument] = useState<Document | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showPreview, setShowPreview] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    status: 'Draft' as 'Draft' | 'Final',
  });

  const fetchDocument = useCallback(async () => {
    try {
      const data = await databases.getDocument(DATABASE_ID, COLLECTIONS.documents, String(id)) as any;
      const normalized = DocumentSchema.parse({
        ...data,
        id: data.id ?? data.$id,
        created_at: data.created_at ?? data.$createdAt,
        updated_at: data.updated_at ?? data.$updatedAt,
      });
      setDocument(normalized);
      setEditData({ title: normalized.title, status: normalized.status });
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchVersions = useCallback(async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.documentVersions, []);
      const rows = (list.documents || []).map((doc: any) => 
        DocumentVersionSchema.parse({
          ...doc,
          id: doc.id ?? doc.$id,
          created_at: doc.created_at ?? doc.$createdAt,
        })
      );
      const filtered = rows.filter(v => String(v.document_id) === String(id));
      setVersions(filtered.sort((a, b) => (b.version - a.version)));
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
    fetchVersions();
  }, [fetchDocument, fetchVersions]);

  const saveChanges = async () => {
    try {
      const updated = await databases.updateDocument(DATABASE_ID, COLLECTIONS.documents, String(id), editData) as any;
      const normalized = DocumentSchema.parse({
        ...updated,
        id: updated.id ?? updated.$id,
        created_at: updated.created_at ?? updated.$createdAt,
        updated_at: updated.updated_at ?? updated.$updatedAt,
      });
      setDocument(normalized);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  const createNewVersion = async () => {
    if (!confirm('Create a new version of this document?')) return;
    
    try {
      const nextVersion = (versions[0]?.version ?? (document?.version ?? 1)) + 1;
      const newVersionDoc: any = await databases.createDocument(DATABASE_ID, COLLECTIONS.documentVersions, 'unique()', {
        document_id: String(id),
        version: nextVersion,
        created_by: user?.$id ?? 'system',
        created_at: new Date().toISOString(),
        changes_summary: 'Manual version creation',
      });
      const newVersion = DocumentVersionSchema.parse({
        ...newVersionDoc,
        id: newVersionDoc.id ?? newVersionDoc.$id,
        created_at: newVersionDoc.created_at ?? newVersionDoc.$createdAt,
      });
      setVersions([newVersion, ...versions]);
      if (document) setDocument({ ...document, version: nextVersion });
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  const duplicateDocument = async () => {
    if (!document) return;
    
    try {
      const created: any = await databases.createDocument(DATABASE_ID, COLLECTIONS.documents, 'unique()', {
        matter_id: String(document.matter_id),
        template_id: document.template_id ? String(document.template_id) : null,
        title: `${document.title} (Copy)`,
        status: 'Draft' as const,
        version: 1,
        file_url: document.file_url || null,
        created_by: user?.$id ?? 'system',
      });
      const newId = created.id ?? created.$id;
      navigate(`/documents/${newId}`);
    } catch (error) {
      console.error('Error duplicating document:', error);
    }
  };

  const deleteDocument = async () => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) return;
    
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.documents, String(id));
      navigate('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const shareDocument = async () => {
    if (!document) return;
    
    // Create a shareable link
    const shareUrl = `${window.location.origin}/documents/shared/${document.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch {
      prompt('Copy this link to share the document:', shareUrl);
    }
  };

  const downloadDocument = () => {
    if (document?.file_url) {
      const url = resolveDownloadUrl(document.file_url);
      if (url) window.open(url, '_blank');
    } else {
      alert('No file available for download');
    }
  };

  const openPreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link to="/documents" className="p-2 hover:bg-gray-100 rounded-lg">
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

  if (!document) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 mb-4">Document not found</p>
        <Link to="/documents" className="text-blue-600 hover:text-blue-700">
          Back to documents
        </Link>
      </div>
    );
  }

  const statusColors = {
    Draft: 'bg-yellow-100 text-yellow-800',
    Final: 'bg-green-100 text-green-800',
  };

  const tabs = [
    { id: 'details', name: 'Details', icon: FileText },
    { id: 'versions', name: 'Versions', icon: History },
    { id: 'activity', name: 'Activity', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/documents" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent"
                aria-label="Edit document title"
                placeholder="Enter document title"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            )}
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-sm text-gray-500">Version {document.version}</span>
              {isEditing ? (
                <select
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value as 'Draft' | 'Final' })}
                  className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-label="Document status"
                  title="Select document status"
                >
                  <option value="Draft">Draft</option>
                  <option value="Final">Final</option>
                </select>
              ) : (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[document.status]}`}>
                  {document.status}
                </span>
              )}
              <span className="text-sm text-gray-500">
                Updated {new Date(document.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveChanges}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={openPreview}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Preview document"
                disabled={!document.file_url}
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                onClick={shareDocument}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Share document"
              >
                <Share2 className="h-4 w-4" />
              </button>
              <button
                onClick={downloadDocument}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Download document"
                disabled={!document.file_url}
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {/* Document Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <FolderOpen className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Matter</p>
              <p className="text-sm text-gray-600">{document.matter_title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Client</p>
              <p className="text-sm text-gray-600">{document.client_name}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Created</p>
              <p className="text-sm text-gray-600">{new Date(document.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={openPreview}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            disabled={!document.file_url}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview Document
          </button>
          
          <button
            onClick={createNewVersion}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            New Version
          </button>
          
          <button
            onClick={duplicateDocument}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </button>
          
          <Link
            to={`/matters/${document.matter_id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            View Matter
          </Link>
          
          <button
            onClick={() => alert('Email functionality would be implemented here')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Email to Client
          </button>
          
          <button
            onClick={deleteDocument}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Document Properties</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">File URL</dt>
                      <dd className="text-sm text-gray-900">
                        {document.file_url ? (
                          <a href={resolveViewUrl(document.file_url) || resolveDownloadUrl(document.file_url) || '#'} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                            View File
                          </a>
                        ) : (
                          'No file attached'
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Template ID</dt>
                      <dd className="text-sm text-gray-900">{document.template_id || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Created By</dt>
                      <dd className="text-sm text-gray-900">{document.created_by}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Document ID</dt>
                      <dd className="text-sm text-gray-900">{document.id}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Tags & Categories</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <Tag className="w-3 h-3 mr-1" />
                    Legal Document
                  </span>
                  <button className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Tag
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">Version History</h4>
                <button
                  onClick={createNewVersion}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Version
                </button>
              </div>
              
              {versions.length > 0 ? (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div key={version.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-900">
                              Version {version.version}
                            </span>
                            {version.version === document.version && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Created by {version.created_by} on {new Date(version.created_at).toLocaleString()}
                          </p>
                          {version.changes_summary && (
                            <p className="text-sm text-gray-600 mt-2">{version.changes_summary}</p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {version.file_url && (
                            <button
                              onClick={() => {
                                const url = resolveViewUrl(version.file_url || undefined) || resolveDownloadUrl(version.file_url || undefined);
                                if (url) window.open(url, '_blank');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="View version file"
                              aria-label="View version file"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => alert('Restore version functionality would be implemented here')}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No version history available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Recent Activity</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Document created</p>
                    <p className="text-xs text-gray-500">{new Date(document.created_at).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Edit className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Document updated</p>
                    <p className="text-xs text-gray-500">{new Date(document.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {document && (
        <DocumentPreview
          isOpen={showPreview}
          onClose={closePreview}
          document={{
            id: document.id.toString(),
            title: document.title,
            file_url: document.file_url || undefined,
            status: document.status,
            created_at: document.created_at,
            version: document.version
          }}
        />
      )}
    </div>
  );
}
