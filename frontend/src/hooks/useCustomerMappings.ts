import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CustomerMapping, 
  CreateCustomerMappingDto, 
  UpdateCustomerMappingDto,
  CreateIPSMappingDto,
  UpdateIPSMappingDto,
  MappingType 
} from '../types/customer-mapping';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ============ GET ALL MAPPINGS ============
const useGetCustomerMappings = (mappingType: MappingType = 'original') => {
  return useQuery({
    queryKey: ['mappings', mappingType],
    queryFn: async (): Promise<CustomerMapping[]> => {
      const endpoint = mappingType === 'original' ? 'original' : mappingType;
      const response = await fetch(`${API_BASE}/api/mappings/${endpoint}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to fetch ${mappingType} mappings`);
      }
      
      return response.json();
    }
  });
};

// ============ CREATE MAPPING ============
const useCreateCustomerMapping = (mappingType: MappingType = 'original') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerMappingDto | CreateIPSMappingDto) => {
      const endpoint = mappingType === 'original' ? 'original' : mappingType;
      const response = await fetch(`${API_BASE}/api/mappings/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to create ${mappingType} mapping`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings', mappingType] });
    }
  });
};

// ============ UPDATE MAPPING ============
const useUpdateCustomerMapping = (mappingType: MappingType = 'original') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      rowNum, 
      data 
    }: { 
      rowNum: number; 
      data: UpdateCustomerMappingDto | UpdateIPSMappingDto 
    }) => {
      const endpoint = mappingType === 'original' ? 'original' : mappingType;
      const response = await fetch(`${API_BASE}/api/mappings/${endpoint}/${rowNum}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to update ${mappingType} mapping`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings', mappingType] });
    }
  });
};

// ============ DELETE MAPPING ============
const useDeleteCustomerMapping = (mappingType: MappingType = 'original') => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rowNum: number) => {
      const endpoint = mappingType === 'original' ? 'original' : mappingType;
      const response = await fetch(`${API_BASE}/api/mappings/${endpoint}/${rowNum}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to delete ${mappingType} mapping`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mappings', mappingType] });
    }
  });
};

export {
  useGetCustomerMappings,
  useCreateCustomerMapping,
  useUpdateCustomerMapping,
  useDeleteCustomerMapping
};
