import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, FileText, FolderOpen, Download, Eye } from 'lucide-react';
import { generateDocumentContent, downloadDocument } from '@/shared/document-generator';
import { databases, storage, DATABASE_ID, COLLECTIONS, BUCKETS } from '@/react-app/lib/appwrite';

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

interface Matter {
  id: number;
  title: string;
  matter_number: string;
  practice_area: string;
  client_first_name: string;
  client_last_name: string;
}

export default function GenerateDocument() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const templateId = searchParams.get('template');
  
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    matter_id: '',
    template_id: templateId || '',
    title: '',
    variables: {} as Record<string, string>,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
    fetchMatters();
  }, []);

  useEffect(() => {
    if (formData.template_id) {
      const template = templates.find(t => t.id.toString() === formData.template_id);
      if (template) {
        setSelectedTemplate(template);
        // Initialize variables with empty strings
        const initialVariables: Record<string, string> = {};
        template.variables.forEach(variable => {
          initialVariables[variable] = '';
        });
        setFormData(prev => ({
          ...prev,
          variables: initialVariables,
          title: template.name
        }));
      }
    }
  }, [formData.template_id, templates]);

  const fetchTemplates = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.documentTemplates, []);
      const rows = (list.documents || []).map((d: any) => ({
        ...d,
        id: d.id ?? d.$id,
        created_at: d.created_at ?? d.$createdAt,
        updated_at: d.updated_at ?? d.$updatedAt,
        variables: Array.isArray(d.variables) ? d.variables : (typeof d.variables === 'string' ? JSON.parse(d.variables || '[]') : []),
      })) as unknown as DocumentTemplate[];
      setTemplates(rows);
    } catch (error) {
      console.error('Error fetching templates:', error);
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.matter_id) newErrors.matter_id = 'Matter is required';
    if (!formData.template_id) newErrors.template_id = 'Template is required';
    if (!formData.title.trim()) newErrors.title = 'Document title is required';

    // Validate all template variables are filled
    if (selectedTemplate) {
      selectedTemplate.variables.forEach(variable => {
        if (!formData.variables[variable]?.trim()) {
          newErrors[`variable_${variable}`] = `${variable} is required`;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateDocument = async () => {
    if (!validateForm() || !selectedTemplate) return;

    setGenerating(true);
    try {
      // Validate template has required fields
      if (!selectedTemplate.body || !selectedTemplate.output_type) {
        throw new Error('Template is missing required fields');
      }

      // Generate the actual document content and file
      const generatedDoc = await generateDocumentContent({
        template: selectedTemplate,
        variables: formData.variables,
        title: formData.title || selectedTemplate.name
      });

      if (!generatedDoc.blob || generatedDoc.blob.size === 0) {
        throw new Error('Generated document is empty');
      }

      // Upload the generated file to Appwrite Storage
      const file = new File([generatedDoc.blob], generatedDoc.filename, { type: generatedDoc.blob.type || 'application/octet-stream' });
      const created = await storage.createFile(BUCKETS.documents, 'unique()', file);
      const fileId = (created as any).$id;

      // Create document record
      const doc = await databases.createDocument(DATABASE_ID, COLLECTIONS.documents, 'unique()', {
        matter_id: formData.matter_id,
        template_id: selectedTemplate?.id?.toString?.() ?? null,
        title: formData.title || selectedTemplate.name,
        status: 'Draft',
        version: 1,
        file_url: `storage://${BUCKETS.documents}/${fileId}`,
      });

      setGeneratedDocument(doc);
      // local download for convenience; storage remains private
      downloadDocument(generatedDoc.blob, generatedDoc.filename);
      setTimeout(() => navigate('/documents'), 1200);
    } catch (error) {
      console.error('Document generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate document. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setGenerating(false);
    }
  };

  const previewDocument = () => {
    if (!selectedTemplate) return '';
    
    let content = selectedTemplate.body;
    
    // Replace variables in the template body
    Object.entries(formData.variables).forEach(([variable, value]) => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      content = content.replace(regex, value);
    });
    
    return content;
  };

  const selectedMatter = matters.find(m => m.id.toString() === formData.matter_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/documents" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Generate Document</h1>
          <p className="text-gray-600">Create a new document from a template</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Document Configuration</h3>
            </div>

            <div className="space-y-6">
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

              {selectedMatter && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedMatter.title}</p>
                      <p className="text-sm text-gray-500">
                        {selectedMatter.matter_number} • {selectedMatter.practice_area}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template *
                </label>
                <select
                  value={formData.template_id}
                  onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.template_id ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a template...</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.category})
                    </option>
                  ))}
                </select>
                {errors.template_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.template_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>
            </div>
          </div>

          {/* Template Variables */}
          {selectedTemplate && selectedTemplate.variables.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Variables</h3>
              <div className="space-y-4">
                {selectedTemplate.variables.map((variable) => (
                  <div key={variable}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} *
                    </label>
                    <input
                      type="text"
                      value={formData.variables[variable] || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        variables: {
                          ...formData.variables,
                          [variable]: e.target.value
                        }
                      })}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[`variable_${variable}`] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder={`Enter ${variable.replace(/_/g, ' ')}`}
                    />
                    {errors[`variable_${variable}`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`variable_${variable}`]}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              to="/documents"
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              onClick={generateDocument}
              disabled={generating || !selectedTemplate}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Generate Document
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
            {selectedTemplate && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => alert('Preview functionality - content is shown below')}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Preview Document"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={async () => {
                    if (!selectedTemplate) return;
                    try {
                      const doc = await generateDocumentContent({
                        template: selectedTemplate,
                        variables: formData.variables,
                        title: formData.title || selectedTemplate.name
                      });
                      downloadDocument(doc.blob, doc.filename);
                    } catch (error) {
                      console.error('Preview generation error:', error);
                      const errorMessage = error instanceof Error ? error.message : 'Error generating preview document';
                      alert(errorMessage);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Download Preview"
                  disabled={!formData.title && !selectedTemplate.name}
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {selectedTemplate ? (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 min-h-96">
              <div className="text-sm text-gray-900 whitespace-pre-wrap">
                {previewDocument() || 'Fill in the template variables to see the preview...'}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Select a template to see the preview</p>
            </div>
          )}

          {generatedDocument && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <FileText className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-900">Document Generated Successfully</p>
                    <p className="text-xs text-green-700">
                      {generatedDocument.title} has been created, saved, and downloaded.
                    </p>
                  </div>
                </div>
                <Link
                  to={`/documents/${generatedDocument.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Document
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
