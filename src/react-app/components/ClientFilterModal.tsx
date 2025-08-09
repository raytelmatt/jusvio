import { useState } from 'react';
import { X, Filter } from 'lucide-react';

interface ClientFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ClientFilters) => void;
  currentFilters: ClientFilters;
}

export interface ClientFilters {
  contactMethod: string;
  portalStatus: string;
  dateRange: string;
  hasEmail: boolean | null;
  hasPhone: boolean | null;
}

export default function ClientFilterModal({ 
  isOpen, 
  onClose, 
  onApplyFilters, 
  currentFilters 
}: ClientFilterModalProps) {
  const [filters, setFilters] = useState<ClientFilters>(currentFilters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: ClientFilters = {
      contactMethod: '',
      portalStatus: '',
      dateRange: '',
      hasEmail: null,
      hasPhone: null,
    };
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl shadow-2xl max-w-md w-full mx-4 border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-blue-300 mr-2" />
            <h3 className="text-lg font-semibold text-white">Filter Clients</h3>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Preferred Contact Method
            </label>
            <select
              value={filters.contactMethod}
              onChange={(e) => setFilters({ ...filters, contactMethod: e.target.value })}
              className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
            >
              <option value="">All Methods</option>
              <option value="Email">Email</option>
              <option value="Phone">Phone</option>
              <option value="SMS">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Portal Status
            </label>
            <select
              value={filters.portalStatus}
              onChange={(e) => setFilters({ ...filters, portalStatus: e.target.value })}
              className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
            >
              <option value="">All Statuses</option>
              <option value="enabled">Portal Enabled</option>
              <option value="disabled">Portal Disabled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200 mb-2">
              Created Date
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40"
            >
              <option value="">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-blue-200">
              Contact Information
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasEmail === true}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    hasEmail: e.target.checked ? true : null 
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-blue-100">Has Email Address</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasPhone === true}
                  onChange={(e) => setFilters({ 
                    ...filters, 
                    hasPhone: e.target.checked ? true : null 
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-blue-100">Has Phone Number</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-white/20">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-blue-200 hover:text-white"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/20 text-sm font-medium rounded-lg text-blue-100 bg-white/10 hover:bg-white/20 backdrop-blur-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
