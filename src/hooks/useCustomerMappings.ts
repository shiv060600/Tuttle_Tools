import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerMapping, CreateCustomerMappingDto, UpdateCustomerMappingDto } from '../types/customer-mapping';
import { toast } from 'sonner@2.0.3';

// Mock data - replace with your actual API calls
const mockData: CustomerMapping[] = [
  { rowNum: 1, billto: 'SL001', shipto: null, hq: 'HQ001', ssacct: 'SA12345' },
  { rowNum: 2, billto: 'SL002', shipto: 'ST001', hq: 'HQ002', ssacct: 'SA12346' },
  { rowNum: 3, billto: 'SL003', shipto: null, hq: 'HQ001', ssacct: 'SA12347' },
  { rowNum: 4, billto: 'SL004', shipto: 'ST002', hq: 'HQ003', ssacct: 'SA12348' },
  { rowNum: 5, billto: 'SL005', shipto: null, hq: 'HQ002', ssacct: 'SA12349' },
];

// TODO: Replace these mock functions with your actual API calls

const fetchCustomerMappings = async (): Promise<CustomerMapping[]> => {
  // Replace with: return await fetch('/api/customer-mappings').then(res => res.json());
  return new Promise((resolve) => {
    setTimeout(() => resolve([...mockData]), 500);
  });
};

const createCustomerMapping = async (data: CreateCustomerMappingDto): Promise<CustomerMapping> => {
  // Replace with: return await fetch('/api/customer-mappings', { method: 'POST', body: JSON.stringify(data) }).then(res => res.json());
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMapping: CustomerMapping = {
        rowNum: mockData.length + 1,
        ...data,
      };
      mockData.push(newMapping);
      resolve(newMapping);
    }, 500);
  });
};

const updateCustomerMapping = async (rowNum: number, data: UpdateCustomerMappingDto): Promise<CustomerMapping> => {
  // Replace with: return await fetch(`/api/customer-mappings/${rowNum}`, { method: 'PUT', body: JSON.stringify(data) }).then(res => res.json());
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockData.findIndex(m => m.rowNum === rowNum);
      if (index === -1) {
        reject(new Error('Customer mapping not found'));
        return;
      }
      mockData[index] = { ...mockData[index], ...data };
      resolve(mockData[index]);
    }, 500);
  });
};

const deleteCustomerMapping = async (rowNum: number): Promise<void> => {
  // Replace with: return await fetch(`/api/customer-mappings/${rowNum}`, { method: 'DELETE' });
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockData.findIndex(m => m.rowNum === rowNum);
      if (index === -1) {
        reject(new Error('Customer mapping not found'));
        return;
      }
      mockData.splice(index, 1);
      resolve();
    }, 500);
  });
};

// React Query Hooks

export const useCustomerMappings = () => {
  return useQuery({
    queryKey: ['customerMappings'],
    queryFn: fetchCustomerMappings,
  });
};

export const useCreateCustomerMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCustomerMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerMappings'] });
      toast.success('Customer mapping created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create customer mapping: ${error.message}`);
    },
  });
};

export const useUpdateCustomerMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rowNum, data }: { rowNum: number; data: UpdateCustomerMappingDto }) =>
      updateCustomerMapping(rowNum, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerMappings'] });
      toast.success('Customer mapping updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update customer mapping: ${error.message}`);
    },
  });
};

export const useDeleteCustomerMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCustomerMapping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerMappings'] });
      toast.success('Customer mapping deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete customer mapping: ${error.message}`);
    },
  });
};
