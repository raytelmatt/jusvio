import { useState, useEffect } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';
import { Link } from 'react-router';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Edit, 
  Trash2,
  Upload,
  Clock,
  User,
  FolderOpen
} from 'lucide-react';
import DocumentPreview from '../components/DocumentPreview';

interface Document {
  id: number;
  matter_id: number;
  template_id?: number;
  title: string;
  version: number;
  created_by: string;
  status: 'Draft' | 'Final';
  file_url?: string;
  created_at: string;
  updated_at: string;
  matter_title?: string;
  client_name?: string;
}

interface DocumentTemplate {
  id: number;
  name: string;
  category: string;
  variables: string[];
  body: string;
  output_type: 'docx' | 'pdf';
  created_at: string;
  updated_at: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchTemplates();
  }, []);

  const fetchDocuments = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.documents, []);
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      })) as unknown as Document[];
      setDocuments(rows);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.documentTemplates, []);
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
      })) as unknown as DocumentTemplate[];
      setTemplates(rows);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const deleteDocument = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTIONS.documents, String(id));
      setDocuments(documents.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const openPreview = (document: Document) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.matter_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.client_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-yellow-100 text-yellow-800';
      case 'Final': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const categories = [...new Set(templates.map(t => t.category))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Documents</h1>
        </div>
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-white/20 rounded"></div>
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
          <h1 className="text-2xl font-bold text-white flex items-center">
            <FileText className="mr-3 h-6 w-6 text-blue-300" />
            Documents
          </h1>
          <p className="text-blue-200">Manage case documents and templates</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/documents/upload"
            className="inline-flex items-center px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-200 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-200"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Link>
          <Link
            to="/documents/generate"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Generate Document
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-300" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {activeTab === 'documents' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
              >
                <option value="all" className="bg-slate-800 text-white">All Status</option>
                <option value="draft" className="bg-slate-800 text-white">Draft</option>
                <option value="final" className="bg-slate-800 text-white">Final</option>
              </select>
            )}
            
            {activeTab === 'templates' && (
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200"
              >
                <option value="all" className="bg-slate-800 text-white">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-slate-800 text-white">{category}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10">
        <div className="border-b border-white/20">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                activeTab === 'documents'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400/50'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Documents ({documents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 ${
                activeTab === 'templates'
                  ? 'border-blue-400 text-blue-300'
                  : 'border-transparent text-blue-200 hover:text-white hover:border-blue-400/50'
              }`}
            >
              <Edit className="h-4 w-4" />
              <span>Templates ({templates.length})</span>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">{doc.title}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          {doc.matter_title && (
                            <div className="flex items-center text-xs text-blue-200">
                              <FolderOpen className="w-3 h-3 mr-1" />
                              {doc.matter_title}
                            </div>
                          )}
                          {doc.client_name && (
                            <div className="flex items-center text-xs text-blue-200">
                              <User className="w-3 h-3 mr-1" />
                              {doc.client_name}
                            </div>
                          )}
                          <div className="flex items-center text-xs text-blue-200">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                            {doc.status}
                          </span>
                          {doc.version > 1 && (
                            <span className="text-xs text-blue-200">v{doc.version}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => openPreview(doc)}
                        className="p-2 text-blue-300 hover:text-blue-100 rounded-lg hover:bg-white/20 transition-colors"
                        title="Preview Document"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {doc.file_url && (
                        <button 
                          onClick={() => window.open(doc.file_url, '_blank')}
                          className="p-2 text-green-300 hover:text-green-100 rounded-lg hover:bg-white/20 transition-colors"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <Link to={`/documents/${doc.id}`} className="p-2 text-blue-300 hover:text-blue-100 rounded-lg hover:bg-white/20 transition-colors" title="Edit Document">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => deleteDocument(doc.id)}
                        className="p-2 text-red-300 hover:text-red-100 rounded-lg hover:bg-white/20 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-blue-300" />
                  <h3 className="mt-2 text-sm font-medium text-white">No documents found</h3>
                  <p className="mt-1 text-sm text-blue-200">
                    Get started by generating a document from a template.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/documents/generate"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Generate Document
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="border border-white/20 rounded-lg p-6 bg-white/10 backdrop-blur-sm hover:bg-white/15 transition-all duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Edit className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {template.output_type.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-white mb-2">{template.name}</h3>
                      <p className="text-xs text-blue-200 mb-3">{template.category}</p>
                      <div className="text-xs text-blue-200 mb-4">
                        Variables: {template.variables.length}
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/documents/generate?template=${template.id}`}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs py-2 px-3 rounded text-center transition-all duration-200"
                        >
                          Use Template
                        </Link>
                        <button 
                          onClick={() => alert('Edit template functionality would be implemented here')}
                          className="p-2 text-blue-300 hover:text-blue-100 rounded transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Edit className="mx-auto h-12 w-12 text-blue-300" />
                  <h3 className="mt-2 text-sm font-medium text-white">No templates found</h3>
                  <p className="mt-1 text-sm text-blue-200">
                    Create document templates to streamline your workflow.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/documents/templates/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Template
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      <DocumentPreview
        isOpen={showPreview}
        onClose={closePreview}
        document={previewDocument}
      />
    </div>
  );
}
