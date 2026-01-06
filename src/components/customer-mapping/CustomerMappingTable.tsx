import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useGetCustomerMappings, useDeleteCustomerMapping } from '../../hooks/useCustomerMappings';
import { CustomerMapping } from '../../types/customer-mapping';
import { CustomerMappingForm } from './CustomerMappingForm';
import { useCreateLog } from '@/hooks/useLogger';
import { LoggingBody } from '@/types/logging';
import { useDebounce } from '@/hooks/useDebounce';

interface ColumnFilters {
  billto: string;
  shipto: string;
  hq: string;
  ssacct: string;
  nameCust: string;
}

const emptyFilters: ColumnFilters = {
  billto: '',
  shipto: '',
  hq: '',
  ssacct: '',
  nameCust: '',
};

const ROWS_PER_PAGE = 50;

export function CustomerMappingTable() {
  const { data: mappings, isLoading, error } = useGetCustomerMappings();
  const deleteMutation = useDeleteCustomerMapping();
  const createLogMutation = useCreateLog();
  
  const [filters, setFilters] = useState<ColumnFilters>(emptyFilters);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CustomerMapping | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce filters - only filter after user stops typing for 250ms
  const debouncedFilters = useDebounce(filters, 250);

  const handleEdit = (mapping: CustomerMapping) => {
    setEditingMapping(mapping);
    setIsFormOpen(true);
  };

  const handleDelete = async (mapping: CustomerMapping) => {
    if (window.confirm(' Are you sure you want to delete this customer mapping?\n\nThis action cannot be undone.')) {
      const loggerBody: LoggingBody = {
        action: 'delete',
        rowNum: mapping.rowNum,
        billto_from: mapping.billto,
        shipto_from: mapping.shipto,
        HQ_from: mapping.hq,
        Ssacct_from: mapping.ssacct,
        billto_to: null,
        shipto_to: null,
        HQ_to: null,
        Ssacct_to: null,
        ACTION_TIMESTAMP: new Date().toISOString()
      };

      deleteMutation.mutate(mapping.rowNum, {
        onSuccess: () => {
          // Create log entry after successful deletion
          createLogMutation.mutate(loggerBody, {
            onSuccess: () => {
              toast.success('Mapping deleted and logged successfully!');
            },
            onError: (err) => {
              // Still show success for delete, but warn about logging failure
              toast.warning('Mapping deleted, but logging failed', {
                description: err instanceof Error ? err.message : 'Failed to create log entry',
              });
            }
          });
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          toast.error('Failed to delete mapping', {
            description: errorMessage,
          });
        },
      });
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMapping(null);
  };

  const handleFilterChange = useCallback((field: keyof ColumnFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page on filter change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyFilters);
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = Object.values(filters).some(f => f !== '');

  // Memoized filtering
  const filteredMappings = useMemo(() => {
    if (!mappings) return [];
    
    return mappings.filter(mapping => {
      const billtoMatch = !debouncedFilters.billto || 
        mapping.billto.toLowerCase().includes(debouncedFilters.billto.toLowerCase());
      const shiptoMatch = !debouncedFilters.shipto || 
        (mapping.shipto && mapping.shipto.toLowerCase().includes(debouncedFilters.shipto.toLowerCase()));
      const hqMatch = !debouncedFilters.hq || 
        mapping.hq.toLowerCase().includes(debouncedFilters.hq.toLowerCase());
      const ssacctMatch = !debouncedFilters.ssacct || 
        mapping.ssacct.toLowerCase().includes(debouncedFilters.ssacct.toLowerCase());
      const nameCustMatch = !debouncedFilters.nameCust || 
        (mapping.nameCust && mapping.nameCust.toLowerCase().includes(debouncedFilters.nameCust.toLowerCase()));

      return billtoMatch && shiptoMatch && hqMatch && ssacctMatch && nameCustMatch;
    });
  }, [mappings, debouncedFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredMappings.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedMappings = filteredMappings.slice(startIndex, startIndex + ROWS_PER_PAGE);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading customer mappings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
            >
              <X className="size-4" />
              Clear Filters
            </button>
          )}
          {mappings && (
            <span className="text-sm text-gray-500">
              Showing {paginatedMappings.length} of {filteredMappings.length} 
              {filteredMappings.length !== mappings.length && ` (${mappings.length} total)`}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-5" />
          Add Mapping
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm min-h-[500px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full h-full">
            <thead>
              {/* Column Headers */}
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-16">Row</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Bill To</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Ship To</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">HQ</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Sage Acct</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
              {/* Filter Row - Always visible */}
              <tr className="bg-gray-50 border-b-2 border-gray-200">
                <td className="px-3 py-1.5"></td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    placeholder="Filter"
                    value={filters.billto}
                    onChange={(e) => handleFilterChange('billto', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    placeholder="Filter"
                    value={filters.shipto}
                    onChange={(e) => handleFilterChange('shipto', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    placeholder="Filter"
                    value={filters.hq}
                    onChange={(e) => handleFilterChange('hq', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    placeholder="Filter"
                    value={filters.ssacct}
                    onChange={(e) => handleFilterChange('ssacct', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    placeholder="Filter"
                    value={filters.nameCust}
                    onChange={(e) => handleFilterChange('nameCust', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </td>
                <td className="px-3 py-1.5"></td>
              </tr>
            </thead>
            <tbody className="relative">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="size-5 animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : paginatedMappings.length > 0 ? (
                paginatedMappings.map((mapping) => (
                  <tr key={mapping.rowNum} className="border-b border-gray-100 hover:bg-blue-50/50">
                    <td className="px-3 py-2 text-sm text-gray-400 font-mono">{mapping.rowNum}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-medium">{mapping.billto}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">
                      {mapping.shipto || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-900">{mapping.hq}</td>
                    <td className="px-3 py-2 text-sm text-gray-900 font-mono">{mapping.ssacct}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 truncate max-w-[200px]" title={mapping.nameCust || ''}>
                      {mapping.nameCust || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          onClick={() => handleEdit(mapping)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(mapping)}
                          disabled={deleteMutation.isPending}
                          className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                    {hasActiveFilters ? 'No matches found.' : 'No data.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
              Prev
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <select
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="px-2 py-1 text-sm border border-gray-300 rounded"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <CustomerMappingForm
          mapping={editingMapping}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
