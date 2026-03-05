import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { getDailyCacheKey, getMillisecondsUntilNextRefresh } from '../utils/reportTiming';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface AvailableReports {
  INV_ADJ_CC_ING: boolean;
  INV_ADJ_CC_IPS: boolean;
  INV_ADJ_OH_IPS: boolean;
  INV_ADJ_OH_ING: boolean;
  INV_RR: boolean;
  INV_TI: boolean;
  ADJ_S_R: boolean;
}

export type ReportType = keyof AvailableReports;

export interface ReportData {
  [key: string]: any;
}

// ============ GET AVAILABLE REPORTS ============
export const useAvailableReports = (): UseQueryResult<AvailableReports, Error> => {
  return useQuery({
    queryKey: ['reports', 'available', getDailyCacheKey()],
    queryFn: async (): Promise<AvailableReports> => {
      const response = await fetch(`${API_BASE_URL}/api/reports/available`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available reports');
      }
      
      return response.json();
    },
    staleTime: getMillisecondsUntilNextRefresh(), // Cache until next 7:50 AM EST
    gcTime: getMillisecondsUntilNextRefresh(), // Keep in cache until next refresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });
};

// ============ GET REPORT DATA ============
export const useReportData = (
  reportType: ReportType | null,
  enabled: boolean = true
): UseQueryResult<ReportData[], Error> => {
  return useQuery({
    queryKey: ['reports', reportType, getDailyCacheKey()],
    queryFn: async (): Promise<ReportData[]> => {
      if (!reportType) {
        throw new Error('No report type specified');
      }

      const response = await fetch(`${API_BASE_URL}/api/reports/${reportType}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch ${reportType} data`);
      }
      
      return response.json();
    },
    enabled: enabled && reportType !== null, // Only fetch if enabled and reportType is set
    staleTime: getMillisecondsUntilNextRefresh(), // Cache until next 7:50 AM EST
    gcTime: getMillisecondsUntilNextRefresh(), // Keep in cache until next refresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data exists
  });
};

// ============ DOWNLOAD EXCEL REPORT ============
export const downloadReportExcel = async (reportType: ReportType): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/reports/${reportType}/excel`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download ${reportType}`);
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// ============ REPORT LABELS ============
export const REPORT_LABELS: Record<ReportType, string> = {
  INV_ADJ_CC_ING: 'INV_ADJ_CC_ING',
  INV_ADJ_CC_IPS: 'INV_ADJ_CC_IPS',
  INV_ADJ_OH_IPS: 'INV_ADJ_OH_IPS',
  INV_ADJ_OH_ING: 'INV_ADJ_OH_ING',
  INV_RR: 'INV_RR',
  INV_TI: 'INV_TI',
  ADJ_S_R: 'ADJ_S_R'
};
