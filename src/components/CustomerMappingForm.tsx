import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CustomerMapping, CreateCustomerMappingDto } from '../types/customer-mapping';
import { useCreateCustomerMapping, useUpdateCustomerMapping } from '../hooks/useCustomerMappings';

interface CustomerMappingFormProps {
  mapping?: CustomerMapping | null;
  onClose: () => void;
}

export function CustomerMappingForm({ mapping, onClose }: CustomerMappingFormProps) {
  const createMutation = useCreateCustomerMapping();
  const updateMutation = useUpdateCustomerMapping();
  
  const [formData, setFormData] = useState<CreateCustomerMappingDto>({
    billto: '',
    shipto: null,
    hq: '',
    ssacct: '',
  });

  useEffect(() => {
    if (mapping) {
      setFormData({
        billto: mapping.billto,
        shipto: mapping.shipto,
        hq: mapping.hq,
        ssacct: mapping.ssacct,
      });
    }
  }, [mapping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mapping) {
      await updateMutation.mutateAsync({ rowNum: mapping.rowNum, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    
    onClose();
  };

  const handleChange = (field: keyof CreateCustomerMappingDto, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? null : value,
    }));
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-gray-900">
            {mapping ? 'Edit Customer Mapping' : 'Add Customer Mapping'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mapping && (
            <div>
              <label className="block text-gray-700 mb-1">Row Number</label>
              <input
                type="text"
                value={mapping.rowNum}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-gray-500">Row number is auto-generated and cannot be edited</p>
            </div>
          )}

          <div>
            <label htmlFor="billto" className="block text-gray-700 mb-1">
              Bill To (SL Number) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="billto"
              required
              value={formData.billto}
              onChange={(e) => handleChange('billto', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SL Number"
            />
          </div>

          <div>
            <label htmlFor="shipto" className="block text-gray-700 mb-1">
              Ship To
            </label>
            <input
              type="text"
              id="shipto"
              value={formData.shipto || ''}
              onChange={(e) => handleChange('shipto', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Usually null (leave blank)"
            />
            <p className="mt-1 text-gray-500">Leave blank for null value</p>
          </div>

          <div>
            <label htmlFor="hq" className="block text-gray-700 mb-1">
              HQ Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="hq"
              required
              value={formData.hq}
              onChange={(e) => handleChange('hq', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter HQ Number"
            />
          </div>

          <div>
            <label htmlFor="ssacct" className="block text-gray-700 mb-1">
              Sage Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="ssacct"
              required
              value={formData.ssacct}
              onChange={(e) => handleChange('ssacct', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter Sage Account Number"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : mapping ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
