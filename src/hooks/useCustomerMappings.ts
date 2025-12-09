import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CustomerMapping, CreateCustomerMappingDto, UpdateCustomerMappingDto } from '../types/customer-mapping';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============ GET ALL MAPPINGS ============
const useGetCustomerMappings = () => {
  return useQuery({
    queryKey: ['mappings'],
    queryFn: async (): Promise<CustomerMapping[]> => {
      const response = await fetch(`${API_BASE}/api/mappings`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch customer mappings');
      }
      
      return response.json();
    }
  });
};

// ============ CREATE MAPPING ============
const useCreateCustomerMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerMappingDto) => {
      const response = await fetch(`${API_BASE}/api/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create customer mapping');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
    }
  });
};

// ============ UPDATE MAPPING ============
const useUpdateCustomerMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rowNum, data }: { rowNum: number; data: UpdateCustomerMappingDto }) => {
      const response = await fetch(`${API_BASE}/api/mappings/${rowNum}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update customer mapping');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
    }
  });
};

// ============ DELETE MAPPING ============
const useDeleteCustomerMapping = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowNum: number) => {
      const response = await fetch(`${API_BASE}/api/mappings/${rowNum}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete customer mapping');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings'] });
    }
  });
};

export {
  useGetCustomerMappings,
  useCreateCustomerMapping,
  useUpdateCustomerMapping,
  useDeleteCustomerMapping
};
