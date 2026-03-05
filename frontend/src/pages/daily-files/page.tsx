import { useState, useEffect, useRef } from 'react';
import { FileText, Download, RefreshCw, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { getNextReportRefreshTime, getMillisecondsUntilNextRefresh, getDailyCacheKey } from '../../utils/reportTiming';

interface AvailableReports {
  INV_ADJ_CC_ING: boolean;
  INV_ADJ_CC_IPS: boolean;
  INV_ADJ_OH_IPS: boolean;
  INV_ADJ_OH_ING: boolean;
  INV_RR: boolean;
  INV_TI: boolean;
  ADJ_S_R: boolean;
}

interface ReportData {
  [key: string]: any[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const REPORT_LABELS: Record<keyof AvailableReports, string> = {
  INV_ADJ_CC_ING: 'Inventory Adjustment CC (ING)',
  INV_ADJ_CC_IPS: 'Inventory Adjustment CC (IPS)',
  INV_ADJ_OH_IPS: 'Inventory Adjustment OH (IPS)',
  INV_ADJ_OH_ING: 'Inventory Adjustment OH (ING)',
  INV_RR: 'Inventory Returns (RR)',
  INV_TI: 'Inventory TI',
  ADJ_S_R: 'Sales/Returns Adjustments'
};

export default function DailyReportsPage() {
  const [availableReports, setAvailableReports] = useState<AvailableReports | null>(null);
  const [reportData, setReportData] = useState<ReportData>({});
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingReport, setLoadingReport] = useState<string | null>(null);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date>(getNextReportRefreshTime());
  const cacheKeyRef = useRef<string>(getDailyCacheKey());
  const refreshTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Check if we need to invalidate cache (new day after 7:50 AM)
    const currentCacheKey = getDailyCacheKey();
    if (currentCacheKey !== cacheKeyRef.current) {
      cacheKeyRef.current = currentCacheKey;
      setReportData({});
      setSelectedReport(null);
      toast.info('New daily reports available! Data has been refreshed.');
    }

    // Load available reports on mount or when cache key changes
    fetchAvailableReports();

    // Set up timer to auto-refresh at next 7:50 AM EST
    const msUntilRefresh = getMillisecondsUntilNextRefresh();
    refreshTimerRef.current = setTimeout(() => {
      const newCacheKey = getDailyCacheKey();
      cacheKeyRef.current = newCacheKey;
      setReportData({});
      setSelectedReport(null);
      setNextRefreshTime(getNextReportRefreshTime());
      toast.success('Daily reports refreshed at 7:50 AM EST!');
      fetchAvailableReports();
    }, msUntilRefresh);

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAvailableReports = async () => {
    setLoading(true);
    try {
      // Check localStorage cache first (keyed by daily cache key)
      const cacheKey = `reports_available_${getDailyCacheKey()}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        setAvailableReports(JSON.parse(cached));
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reports/available`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch available reports');
      }
      
      const data = await response.json();
      setAvailableReports(data);
      
      // Cache until next 7:50 AM EST
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching available reports:', error);
      toast.error('Failed to fetch available reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportData = async (reportType: string) => {
    // Check if already loaded today
    if (reportData[reportType]) {
      setSelectedReport(reportType);
      return;
    }

    setLoadingReport(reportType);
    try {
      // Check localStorage cache first (keyed by daily cache key)
      const cacheKey = `report_data_${reportType}_${getDailyCacheKey()}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const data = JSON.parse(cached);
        setReportData(prev => ({ ...prev, [reportType]: data }));
        setSelectedReport(reportType);
        setLoadingReport(null);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/reports/${reportType}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${reportType} data`);
      }
      
      const data = await response.json();
      setReportData(prev => ({ ...prev, [reportType]: data }));
      setSelectedReport(reportType);
      
      // Cache until next 7:50 AM EST
      localStorage.setItem(cacheKey, JSON.stringify(data));
      
      toast.success(`Loaded ${REPORT_LABELS[reportType as keyof AvailableReports]}`);
    } catch (error) {
      console.error(`Error fetching ${reportType}:`, error);
      toast.error(`Failed to load ${reportType}`);
    } finally {
      setLoadingReport(null);
    }
  };

  const downloadExcel = async (reportType: string) => {
    try {
      toast.info(`Downloading ${REPORT_LABELS[reportType as keyof AvailableReports]}...`);
      
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
      
      toast.success(`Downloaded ${REPORT_LABELS[reportType as keyof AvailableReports]}`);
    } catch (error) {
      console.error(`Error downloading ${reportType}:`, error);
      toast.error(`Failed to download ${reportType}`);
    }
  };

  const renderTableData = (reportType: string) => {
    const data = reportData[reportType];
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No data available for this report
        </div>
      );
    }

    const columns = Object.keys(data[0]);

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
            {data.map((row, idx) => (
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
    <div className="container mx-auto p-6 space-y-6">
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
          onClick={() => {
            // Clear cache and force refresh
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
              if (key.startsWith('reports_') || key.startsWith('report_data_')) {
                localStorage.removeItem(key);
              }
            });
            setReportData({});
            setSelectedReport(null);
            fetchAvailableReports();
          }}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Force Refresh
        </Button>
      </div>

      {/* Available Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableReports &&
          Object.entries(availableReports).map(([reportType, isAvailable]) => (
            <Card
              key={reportType}
              className={`${
                isAvailable
                  ? 'border-green-300 bg-green-50/50'
                  : 'border-gray-200 bg-gray-50/50 opacity-60'
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="size-5" />
                  {REPORT_LABELS[reportType as keyof AvailableReports]}
                </CardTitle>
                <CardDescription>
                  {isAvailable ? (
                    <span className="text-green-600 font-medium">Available</span>
                  ) : (
                    <span className="text-gray-500">Not available</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={() => fetchReportData(reportType)}
                  disabled={!isAvailable || loadingReport === reportType}
                  className="w-full"
                  variant={selectedReport === reportType ? 'default' : 'outline'}
                >
                  {loadingReport === reportType ? (
                    <>
                      <RefreshCw className="size-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'View Report'
                  )}
                </Button>
                <Button
                  onClick={() => downloadExcel(reportType)}
                  disabled={!isAvailable}
                  className="w-full"
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
      {selectedReport && reportData[selectedReport] && (
        <Card>
          <CardHeader>
            <CardTitle>
              {REPORT_LABELS[selectedReport as keyof AvailableReports]}
            </CardTitle>
            <CardDescription>
              Showing {reportData[selectedReport].length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderTableData(selectedReport)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
