import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Save, Edit, Plus, Trash2 } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

export default function NewTemplate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'General',
    body: '',
    output_type: 'pdf' as 'docx' | 'pdf',
    variables: [] as string[],
  });
  const [newVariable, setNewVariable] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    'General',
    'Criminal',
    'Personal Injury',
    'SSD',
    'Contracts',
    'Motions',
    'Pleadings',
    'Letters',
    'Forms',
  ];

  const addVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData({
        ...formData,
        variables: [...formData.variables, newVariable.trim()]
      });
      setNewVariable('');
    }
  };

  const removeVariable = (index: number) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((_, i) => i !== index)
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Template name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.body.trim()) newErrors.body = 'Template body is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.documentTemplates, 'unique()', {
        name: formData.name,
        category: formData.category,
        body: formData.body,
        output_type: formData.output_type,
        variables: JSON.stringify(formData.variables),
      });
      navigate('/documents');
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-body') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newValue = before + `{{${variable}}}` + after;
      
      setFormData({ ...formData, body: newValue });
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/documents" className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-white" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Document Template</h1>
          <p className="text-gray-600">Build a reusable document template</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white/8 backdrop-blur-xl rounded-xl shadow-xl border border-white/10 p-6">
              <div className="flex items-center mb-4">
                <Edit className="h-5 w-5 text-blue-300 mr-2" />
                <h3 className="text-lg font-semibold text-white">Template Information</h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-1">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                        errors.name ? 'border-red-400/50' : 'border-white/20'
                      }`}
                      placeholder="Enter template name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-blue-200 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 ${
                        errors.category ? 'border-red-400/50' : 'border-white/20'
                      }`}
                    >
                      {categories.map(category => (
                        <option key={category} value={category} className="bg-slate-800 text-white">{category}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-400">{errors.category}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">
                    Output Format
                  </label>
                  <select
                    value={formData.output_type}
                    onChange={(e) => setFormData({ ...formData, output_type: e.target.value as 'docx' | 'pdf' })}
                    className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200"
                  >
                    <option value="pdf" className="bg-slate-800 text-white">PDF Document (.pdf)</option>
                    <option value="docx" className="bg-slate-800 text-white">Word Document (.docx)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-1">
                    Template Body *
                  </label>
                  <textarea
                    id="template-body"
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={12}
                    className={`w-full px-3 py-2 border rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 font-mono text-sm ${
                      errors.body ? 'border-red-400/50' : 'border-white/20'
                    }`}
                    placeholder="Enter your template content here. Use {{variable_name}} for dynamic content."
                  />
                  {errors.body && (
                    <p className="mt-1 text-sm text-red-400">{errors.body}</p>
                  )}
                  <p className="mt-1 text-xs text-blue-300">
                    Use {`{{variable_name}}`} syntax to insert dynamic content
                  </p>
                </div>
              </div>
            </div>

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
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Variables Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Variables</h3>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newVariable}
                  onChange={(e) => setNewVariable(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addVariable())}
                  className="flex-1 px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 focus:bg-white/15 transition-all duration-200 text-sm"
                  placeholder="Variable name"
                />
                <button
                  type="button"
                  onClick={addVariable}
                  className="px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {formData.variables.map((variable, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                    <button
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="flex-1 text-left text-sm font-mono text-white hover:text-blue-300 transition-colors"
                    >
                      {`{{${variable}}}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVariable(index)}
                      className="text-red-300 hover:text-red-100 p-1 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {formData.variables.length === 0 && (
                <p className="text-sm text-blue-200 text-center py-4">
                  No variables defined. Add variables to make your template dynamic.
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-500/20 rounded-xl p-4 border border-blue-400/30 backdrop-blur-sm">
            <h4 className="text-sm font-semibold text-blue-200 mb-2">Tips</h4>
            <ul className="text-xs text-blue-300 space-y-1">
              <li>• Use descriptive variable names like "client_name" or "case_number"</li>
              <li>• Click on a variable to insert it at your cursor position</li>
              <li>• Variables will be replaced with actual values when generating documents</li>
              <li>• Use underscores instead of spaces in variable names</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
