import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, Save, DollarSign, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/react-app/lib/appwrite';

interface Matter {
  id: number;
  title: string;
  matter_number: string;
  practice_area: string;
  client_first_name: string;
  client_last_name: string;
}

interface TimeEntry {
  id: number;
  entry_date: string;
  hours: number;
  rate: number;
  description: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [matters, setMatters] = useState<Matter[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    matter_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    taxes: 0,
    discounts: 0,
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMatters();
  }, []);

  useEffect(() => {
    if (formData.matter_id) {
      fetchTimeEntries(parseInt(formData.matter_id));
    }
  }, [formData.matter_id]);

  const fetchMatters = async () => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, 'matters', []);
      setMatters((list.documents || []) as unknown as Matter[]);
    } catch (error) {
      console.error('Error fetching matters:', error);
    }
  };

  const fetchTimeEntries = async (_matterId: number) => {
    try {
      const list = await databases.listDocuments(DATABASE_ID, COLLECTIONS.timeEntries, []);
      setTimeEntries((list.documents || []) as unknown as TimeEntry[]);
    } catch (error) {
      console.error('Error fetching time entries:', error);
    }
  };

  const addTimeEntryToInvoice = (timeEntry: TimeEntry) => {
    const newLineItem: LineItem = {
      id: `time-${timeEntry.id}`,
      description: `${new Date(timeEntry.entry_date).toLocaleDateString()} - ${timeEntry.description}`,
      quantity: timeEntry.hours,
      rate: timeEntry.rate,
      amount: timeEntry.hours * timeEntry.rate,
    };
    setLineItems([...lineItems, newLineItem]);
  };

  const addCustomLineItem = () => {
    const newLineItem: LineItem = {
      id: `custom-${Date.now()}`,
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setLineItems([...lineItems, newLineItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const taxes = subtotal * (formData.taxes / 100);
    const discounts = subtotal * (formData.discounts / 100);
    const total = subtotal + taxes - discounts;
    
    return { subtotal, taxes, discounts, total };
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.matter_id) newErrors.matter_id = 'Matter is required';
    if (!formData.issue_date) newErrors.issue_date = 'Issue date is required';
    if (!formData.due_date) newErrors.due_date = 'Due date is required';
    if (lineItems.length === 0) newErrors.lineItems = 'At least one line item is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const totals = calculateTotals();

    setLoading(true);
    try {
      await databases.createDocument(DATABASE_ID, COLLECTIONS.invoices, 'unique()', {
        matter_id: parseInt(formData.matter_id),
        invoice_number: String(Date.now()).slice(-6),
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        line_items: JSON.stringify(lineItems),
        subtotal: totals.subtotal,
        taxes: totals.taxes,
        discounts: totals.discounts,
        total: totals.total,
        status: 'Draft',
      });
      navigate('/billing');
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedMatter = matters.find(m => m.id.toString() === formData.matter_id);
  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/billing" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Invoice</h1>
          <p className="text-gray-600">Generate a new invoice for a matter</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
        {/* Invoice Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
          </div>

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

            <div className="md:col-start-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Date *
              </label>
              <input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.issue_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.issue_date && (
                <p className="mt-1 text-sm text-red-600">{errors.issue_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.due_date ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.due_date && (
                <p className="mt-1 text-sm text-red-600">{errors.due_date}</p>
              )}
            </div>
          </div>

          {selectedMatter && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedMatter.title}</p>
                  <p className="text-sm text-gray-500">
                    {selectedMatter.client_first_name} {selectedMatter.client_last_name} • {selectedMatter.matter_number}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Available Time Entries */}
        {timeEntries.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Time Entries</h3>
            <div className="space-y-2">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{entry.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.entry_date).toLocaleDateString()} • {entry.hours}h @ ${entry.rate}/hr
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">${(entry.hours * entry.rate).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => addTimeEntryToInvoice(entry)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Add to Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
            <button
              type="button"
              onClick={addCustomLineItem}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Item
            </button>
          </div>

          {lineItems.length > 0 ? (
            <div className="space-y-4">
              {lineItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 border border-gray-200 rounded-lg">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.25"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      placeholder="Qty"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate}
                      onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="Rate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-gray-900">${item.amount.toFixed(2)}</p>
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeLineItem(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No line items added yet.</p>
              {errors.lineItems && (
                <p className="mt-1 text-sm text-red-600">{errors.lineItems}</p>
              )}
            </div>
          )}
        </div>

        {/* Totals */}
        {lineItems.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Totals</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.taxes}
                  onChange={(e) => setFormData({ ...formData, taxes: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discount Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discounts}
                  onChange={(e) => setFormData({ ...formData, discounts: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">${totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.taxes > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Taxes ({formData.taxes}%):</span>
                    <span className="text-gray-900">${totals.taxes.toFixed(2)}</span>
                  </div>
                )}
                {totals.discounts > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount ({formData.discounts}%):</span>
                    <span className="text-gray-900">-${totals.discounts.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">${totals.total.toFixed(2)}</span>
                </div>
              </div>
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
            to="/billing"
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
                Create Invoice
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
