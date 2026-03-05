import { useState, useEffect, useRef } from 'react';
import { FileText, Download, RefreshCw, Clock, Eye, FileDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useAvailableReports, 
  useReportData, 
  downloadReportExcel, 
  REPORT_LABELS,
  ReportType 
} from '../../hooks/useReports';
import { viewPDF, downloadPDF } from '../../components/reports/ReportPDF';
import { getNextReportRefreshTime, getMillisecondsUntilNextRefresh, getDailyCacheKey } from '../../utils/reportTiming';

export default function DailyReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(getNextReportRefreshTime());
  const cacheKeyRef = useRef<string>(getDailyCacheKey());
  const refreshTimerRef = useRef<NodeJS.Timeout>();
  const queryClient = useQueryClient();

  // Fetch available reports
  const { 
    data: availableReports, 
    isLoading: loadingAvailable,
    refetch: refetchAvailable 
  } = useAvailableReports();

  // Fetch selected report data
  const { 
    data: reportData, 
    isLoading: loadingReport 
  } = useReportData(selectedReport, selectedReport !== null);

  useEffect(() => {
    // Check if we need to invalidate cache (new day after 7:50 AM)
    const currentCacheKey = getDailyCacheKey();
    if (currentCacheKey !== cacheKeyRef.current) {
      cacheKeyRef.current = currentCacheKey;
      setSelectedReport(null);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.info('New daily reports available! Data has been refreshed.');
    }

    // Set up timer to auto-refresh at next 7:50 AM EST
    const msUntilRefresh = getMillisecondsUntilNextRefresh();
    refreshTimerRef.current = setTimeout(() => {
      const newCacheKey = getDailyCacheKey();
      cacheKeyRef.current = newCacheKey;
      setSelectedReport(null);
      setNextRefreshTime(getNextReportRefreshTime());
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Daily reports refreshed at 7:50 AM EST!');
    }, msUntilRefresh);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [queryClient]);

  const handleDownloadExcel = async (reportType: ReportType) => {
    try {
      toast.info(`Downloading ${reportType} Excel...`);
      await downloadReportExcel(reportType);
      toast.success(`Downloaded ${reportType}`);
    } catch (error) {
      console.error(`Error downloading ${reportType}:`, error);
      toast.error(`Failed to download ${reportType}`);
    }
  };

  const handleViewPDF = async (reportType: ReportType) => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['reports', reportType, getDailyCacheKey()],
        queryFn: async () => {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reports/${reportType}`, {
            credentials: 'include'
          });
          if (!response.ok) throw new Error('Failed to fetch report');
          return response.json();
        }
      });
      
      toast.info(`Opening ${reportType} PDF...`);
      await viewPDF(reportType, data);
    } catch (error) {
      console.error(`Error viewing PDF:`, error);
      toast.error(`Failed to open ${reportType} PDF`);
    }
  };

  const handleDownloadPDF = async (reportType: ReportType) => {
    try {
      const data = await queryClient.fetchQuery({
        queryKey: ['reports', reportType, getDailyCacheKey()],
        queryFn: async () => {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/reports/${reportType}`, {
            credentials: 'include'
          });
          if (!response.ok) throw new Error('Failed to fetch report');
          return response.json();
        }
      });
      
      toast.info(`Downloading ${reportType} PDF...`);
      await downloadPDF(reportType, data);
      toast.success(`Downloaded ${reportType} PDF`);
    } catch (error) {
      console.error(`Error downloading PDF:`, error);
      toast.error(`Failed to download ${reportType} PDF`);
    }
  };

  const handleForceRefresh = () => {
    setSelectedReport(null);
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    refetchAvailable();
  };

  const renderTableData = () => {
    if (!reportData || reportData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for this report
        </div>
      );
    }

    const columns = Object.keys(reportData[0]);

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reportData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Daily Reports</h1>
          <p className="text-gray-600 mt-2">
            View and download daily inventory and sales reports
          </p>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <Clock className="size-4" />
            Reports refresh daily at 7:50 AM EST • Next refresh: {nextRefreshTime.toLocaleString('en-US', { 
              timeZone: 'America/New_York',
              dateStyle: 'short',
              timeStyle: 'short'
            })}
          </p>
        </div>
        <Button
          onClick={handleForceRefresh}
          disabled={loadingAvailable}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`size-4 ${loadingAvailable ? 'animate-spin' : ''}`} />
          Force Refresh
        </Button>
      </div>

      {/* Available Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {availableReports &&
          Object.entries(availableReports).map(([reportType, isAvailable]) => (
            <Card
              key={reportType}
              className={`transition-all duration-200 hover:shadow-lg ${
                isAvailable
                  ? 'border-blue-200 bg-white shadow-md'
                  : 'border-gray-200 bg-gray-50 opacity-50'
              }`}
            >
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-mono">
                  <FileText className={`size-5 ${isAvailable ? 'text-blue-600' : 'text-gray-400'}`} />
                  {REPORT_LABELS[reportType as ReportType]}
                </CardTitle>
                <CardDescription className="text-xs">
                  {isAvailable ? (
                    <span className="text-blue-600 font-semibold">● Available</span>
                  ) : (
                    <span className="text-gray-400">● Not available</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-5">
                <Button
                  onClick={() => setSelectedReport(reportType as ReportType)}
                  disabled={!isAvailable || (loadingReport && selectedReport === reportType)}
                  className="w-full h-11"
                  variant={selectedReport === reportType ? 'default' : 'outline'}
                >
                  {loadingReport && selectedReport === reportType ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <FileText className="size-4 mr-2" />
                      View Data
                    </>
                  )}
                </Button>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleViewPDF(reportType as ReportType)}
                    disabled={!isAvailable}
                    className="w-full h-10"
                    variant="outline"
                  >
                    <Eye className="size-4 mr-1.5" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownloadPDF(reportType as ReportType)}
                    disabled={!isAvailable}
                    className="w-full h-10"
                    variant="outline"
                  >
                    <FileDown className="size-4 mr-1.5" />
                    Save
                  </Button>
                </div>
                
                <Button
                  onClick={() => handleDownloadExcel(reportType as ReportType)}
                  disabled={!isAvailable}
                  className="w-full h-11"
                  variant="outline"
                >
                  <Download className="size-4 mr-2" />
                  Download Excel
                </Button>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Report Display */}
      {selectedReport && reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="font-mono">
              {REPORT_LABELS[selectedReport]}
            </CardTitle>
            <CardDescription>
              Showing {reportData.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderTableData()}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loadingReport && selectedReport && (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <RefreshCw className="size-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading {REPORT_LABELS[selectedReport]}...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
