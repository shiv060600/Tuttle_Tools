import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { CustomerMapping, CreateCustomerMappingDto, CreateIPSMappingDto, MappingType } from '../../types/customer-mapping';
import { useCreateCustomerMapping, useUpdateCustomerMapping } from '../../hooks/useCustomerMappings';
import { useCreateLog } from '../../hooks/useLogger';
import { LoggingBody } from '../../types/logging';

interface CustomerMappingFormProps {
  mapping?: CustomerMapping | null;
  mappingType: MappingType;
  onClose: () => void;
}

export function CustomerMappingForm({ mapping, mappingType, onClose }: CustomerMappingFormProps) {
  const createMutation = useCreateCustomerMapping(mappingType);
  const updateMutation = useUpdateCustomerMapping(mappingType);
  const createLogMutation = useCreateLog(mappingType);
  
  const [formData, setFormData] = useState<CreateCustomerMappingDto | CreateIPSMappingDto>(
    mappingType === 'ips' 
      ? { hq: '', ssacct: '' }
      : { billto: '', shipto: null, hq: '', ssacct: '' }
  );

  useEffect(() => {
    if (mapping) {
      if (mappingType === 'ips') {
        setFormData({
          hq: mapping.hq,
          ssacct: mapping.ssacct,
        });
      } else {
        setFormData({
          billto: mapping.billto || '',
          shipto: mapping.shipto,
          hq: mapping.hq,
          ssacct: mapping.ssacct,
        });
      }
    } else {
      // Reset form when creating new
      setFormData(
        mappingType === 'ips' 
          ? { hq: '', ssacct: '' }
          : { billto: '', shipto: null, hq: '', ssacct: '' }
      );
    }
  }, [mapping, mappingType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (mapping) {
        // Update existing mapping
        await updateMutation.mutateAsync({ rowNum: mapping.rowNum, data: formData });
        
        // Log the edit
        const loggerBody: LoggingBody = {
          action: 'edit',
          rowNum: mapping.rowNum,
          billto_from: mappingType === 'ips' ? null : mapping.billto,
          shipto_from: mappingType === 'ips' ? null : mapping.shipto,
          HQ_from: mapping.hq,
          Ssacct_from: mapping.ssacct,
          billto_to: mappingType === 'ips' ? null : (formData as CreateCustomerMappingDto).billto,
          shipto_to: mappingType === 'ips' ? null : (formData as CreateCustomerMappingDto).shipto,
          HQ_to: formData.hq,
          Ssacct_to: formData.ssacct,
          ACTION_TIMESTAMP: new Date().toISOString(),
        };
        await createLogMutation.mutateAsync(loggerBody);
        
        toast.success('Mapping updated successfully!');
      } else {
        // Create new mapping
        await createMutation.mutateAsync(formData);
        
        // Log the insert
        const loggerBody: LoggingBody = {
          action: 'insert',
          rowNum: null,
          billto_from: null,
          shipto_from: null,
          HQ_from: null,
          Ssacct_from: null,
          billto_to: mappingType === 'ips' ? null : (formData as CreateCustomerMappingDto).billto,
          shipto_to: mappingType === 'ips' ? null : (formData as CreateCustomerMappingDto).shipto,
          HQ_to: formData.hq,
          Ssacct_to: formData.ssacct,
          ACTION_TIMESTAMP: new Date().toISOString(),
        };
        await createLogMutation.mutateAsync(loggerBody);
        
        toast.success('Mapping created successfully!');
      }
      
      // Only close the form if everything succeeded
      onClose();
    } catch (error) {
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error(mapping ? 'Failed to update mapping' : 'Failed to create mapping', {
        description: errorMessage,
      });
      console.error('Form submission error:', error);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value === '' ? (field === 'shipto' ? null : '') : value,
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

          {mappingType === 'original' && (
            <>
              <div>
                <label htmlFor="billto" className="block text-gray-700 mb-1">
                  Bill To (SL Number) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="billto"
                  required
                  value={(formData as CreateCustomerMappingDto).billto || ''}
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
                  value={(formData as CreateCustomerMappingDto).shipto || ''}
                  onChange={(e) => handleChange('shipto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Usually null (leave blank)"
                />
                <p className="mt-1 text-gray-500">Leave blank for null value</p>
              </div>
            </>
          )}

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
