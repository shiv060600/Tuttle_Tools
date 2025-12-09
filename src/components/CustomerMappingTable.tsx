import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useCustomerMappings, useDeleteCustomerMapping } from '../hooks/useCustomerMappings';
import { CustomerMapping } from '../types/customer-mapping';
import { CustomerMappingForm } from './CustomerMappingForm';

export function CustomerMappingTable() {
  const { data: mappings, isLoading, error } = useCustomerMappings();
  const deleteMutation = useDeleteCustomerMapping();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<CustomerMapping | null>(null);

  const handleEdit = (mapping: CustomerMapping) => {
    setEditingMapping(mapping);
    setIsFormOpen(true);
  };

  const handleDelete = async (rowNum: number) => {
    if (window.confirm('Are you sure you want to delete this customer mapping?')) {
      deleteMutation.mutate(rowNum);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingMapping(null);
  };

  const filteredMappings = mappings?.filter(mapping => {
    const search = searchTerm.toLowerCase();
    return (
      mapping.billto.toLowerCase().includes(search) ||
      mapping.hq.toLowerCase().includes(search) ||
      mapping.ssacct.toLowerCase().includes(search) ||
      (mapping.shipto && mapping.shipto.toLowerCase().includes(search))
    );
  });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading customer mappings. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Bill To, Ship To, HQ, or Sage Account..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="size-5" />
          Add Customer Mapping
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-gray-700">Row #</th>
                <th className="px-6 py-3 text-left text-gray-700">Bill To (SL Number)</th>
                <th className="px-6 py-3 text-left text-gray-700">Ship To</th>
                <th className="px-6 py-3 text-left text-gray-700">HQ Number</th>
                <th className="px-6 py-3 text-left text-gray-700">Sage Account Number</th>
                <th className="px-6 py-3 text-right text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500">
                      <Loader2 className="size-5 animate-spin" />
                      Loading customer mappings...
                    </div>
                  </td>
                </tr>
              ) : filteredMappings && filteredMappings.length > 0 ? (
                filteredMappings.map((mapping) => (
                  <tr key={mapping.rowNum} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{mapping.rowNum}</td>
                    <td className="px-6 py-4 text-gray-900">{mapping.billto}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {mapping.shipto || <span className="text-gray-400 italic">null</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{mapping.hq}</td>
                    <td className="px-6 py-4 text-gray-900">{mapping.ssacct}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(mapping)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.rowNum)}
                          disabled={deleteMutation.isPending}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No customer mappings found matching your search.' : 'No customer mappings yet. Add one to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
