import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Save, Upload, FolderOpen } from 'lucide-react';
import FileUploadZone from '../components/FileUploadZone';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS } from '@/react-app/lib/appwrite';

interface Matter {
  id: number;
  title: string;
  matter_number: string;
  practice_area: string;
  client_first_name: string;
  client_last_name: string;
}

export default function UploadDocument() {
  const navigate = useNavigate();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    matter_id: '',
    title: '',
    status: 'Draft' as 'Draft' | 'Final',
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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (!formData.title) {
      setFormData(prev => ({
        ...prev,
        title: file.name.replace(/\.[^/.]+$/, "") // Remove file extension
      }));
    }
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.matter_id) newErrors.matter_id = 'Matter is required';
    if (!formData.title.trim()) newErrors.title = 'Document title is required';
    if (!selectedFile) newErrors.file = 'Please select a file to upload';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Upload to Appwrite Storage and create document
      const created = await storage.createFile(BUCKETS.documents, 'unique()', selectedFile!);
      const fileId = (created as any).$id;
      await databases.createDocument(DATABASE_ID, COLLECTIONS.documents, 'unique()', {
        matter_id: formData.matter_id,
        title: formData.title,
        status: formData.status,
        version: 1,
        file_url: `storage://${BUCKETS.documents}/${fileId}`,
      });
      navigate('/documents');
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
        <Link to="/documents" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Upload Document</h1>
          <p className="text-blue-200">Upload an existing document to a matter</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
          <div className="flex items-center mb-4">
            <Upload className="h-5 w-5 text-blue-300 mr-2" />
            <h3 className="text-lg font-semibold text-white">Document Upload</h3>
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

            {/* File Upload Area */}
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">
                File *
              </label>
              <FileUploadZone
                onFileSelect={handleFileSelect}
                selectedFile={selectedFile}
                onFileRemove={handleFileRemove}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                maxSize={10 * 1024 * 1024}
                loading={loading}
              />
              {errors.file && (
                <p className="mt-1 text-sm text-red-400">{errors.file}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Document Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                  errors.title ? 'border-red-400/50' : 'border-white/20'
                }`}
                placeholder="Enter document title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Draft' | 'Final' })}
                className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
              >
                <option value="Draft" className="bg-slate-800 text-white">Draft</option>
                <option value="Final" className="bg-slate-800 text-white">Final</option>
              </select>
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
            to="/documents"
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
                Uploading...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Upload Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
