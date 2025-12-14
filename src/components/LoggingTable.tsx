import { useMemo, useState, useEffect } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useLogging, useDeleteLogItem, useDeleteOldLogs } from '../hooks/useLogger';
import { LogEntry, LogDeleteResponse } from '../types/logging';

// simple debounce hook reused for filters
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

type LogFilters = {
  action: string;
  billtoFrom: string;
  billtoTo: string;
  shiptoFrom: string;
  shiptoTo: string;
  hqFrom: string;
  hqTo: string;
  ssacctFrom: string;
  ssacctTo: string;
  rowNum: string;
};

const emptyFilters: LogFilters = {
  action: '',
  billtoFrom: '',
  billtoTo: '',
  shiptoFrom: '',
  shiptoTo: '',
  hqFrom: '',
  hqTo: '',
  ssacctFrom: '',
  ssacctTo: '',
  rowNum: '',
};

const formatTs = (ts: string) => {
  const d = new Date(ts);
  return isNaN(d.getTime()) ? ts : d.toLocaleString();
};

export function LoggingTable() {
  const { data: logs, isLoading } = useLogging();
  const deleteItem = useDeleteLogItem();
  const clearOld = useDeleteOldLogs();

  const [filters, setFilters] = useState<LogFilters>(emptyFilters);
  const [clearDays, setClearDays] = useState<number>(30);

  const debouncedFilters = useDebounce(filters, 250);

  const handleFilterChange = (key: keyof LogFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(emptyFilters);

  const hasActiveFilters = Object.values(filters).some((v) => v !== '');

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    return logs.filter((log) => {
      const match = (field: string | null | undefined, filter: string) =>
        filter === '' || (field ?? '').toLowerCase().includes(filter.toLowerCase());

      const rowMatch = !debouncedFilters.rowNum || `${log.rowNum ?? ''}`.includes(debouncedFilters.rowNum);

      return (
        match(log.action, debouncedFilters.action) &&
        match(log.billtoFrom, debouncedFilters.billtoFrom) &&
        match(log.billtoTo, debouncedFilters.billtoTo) &&
        match(log.shiptoFrom, debouncedFilters.shiptoFrom) &&
        match(log.shiptoTo, debouncedFilters.shiptoTo) &&
        match(log.hqFrom, debouncedFilters.hqFrom) &&
        match(log.hqTo, debouncedFilters.hqTo) &&
        match(log.ssacctFrom, debouncedFilters.ssacctFrom) &&
        match(log.ssacctTo, debouncedFilters.ssacctTo) &&
        rowMatch
      );
    });
  }, [logs, debouncedFilters]);

  const handleDeleteLog = (log: LogEntry) => {
    const target = log.logId ?? '';
    if (!target) return;
    if (window.confirm('Delete this log entry?')) {
      deleteItem.mutate(target, {
        onSuccess: () => {
          toast.success('Log entry deleted successfully!');
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          toast.error('Failed to delete log entry', {
            description: errorMessage,
          });
        },
      });
    }
  };

  const handleClearOld = () => {
    if (!clearDays || clearDays <= 0) {
      toast.error('Invalid number of days', {
        description: 'Please enter a number greater than 0',
      });
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete all logs older than ${clearDays} days?\n\nThis action cannot be undone.`)) {
      clearOld.mutate(clearDays, {
        onSuccess: (data: LogDeleteResponse) => {
          const count = data.deleted_count ?? 0;
          if (count > 0) {
            toast.success(`Cleanup complete!`, {
              description: `Successfully deleted ${count} log ${count === 1 ? 'entry' : 'entries'}`,
            });
          } else {
            toast.info('No old logs found', {
              description: `No logs older than ${clearDays} days were found`,
            });
          }
        },
        onError: (error) => {
          const errorMessage = error instanceof Error ? error.message : 'An error occurred';
          toast.error('Failed to delete old logs', {
            description: errorMessage,
          });
        },
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
            >
              <X className="size-4" />
              Clear Filters
            </button>
          )}
          {logs && (
            <span className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {logs.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
          <label htmlFor="clearDays" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Delete logs older than:
          </label>
          <input
            id="clearDays"
            type="number"
            min={1}
            value={clearDays}
            onChange={(e) => setClearDays(Number(e.target.value))}
            className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="30"
          />
          <span className="text-sm text-gray-600">days</span>
          <button
            onClick={handleClearOld}
            disabled={clearOld.isPending}
            className="px-3 py-1.5 text-sm bg-red-600 text-black rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {clearOld.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm min-h-[500px] flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full h-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Timestamp</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Row #</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">BillTo From</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">BillTo To</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ShipTo From</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ShipTo To</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">HQ From</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">HQ To</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">SSAcct From</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">SSAcct To</th>
                <th className="px-3 py-2 w-16"></th>
              </tr>
              <tr className="bg-gray-50 border-b-2 border-gray-200 text-sm">
                <td className="px-3 py-1.5"></td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                    placeholder="Action"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.rowNum}
                    onChange={(e) => handleFilterChange('rowNum', e.target.value)}
                    placeholder="Row #"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.billtoFrom}
                    onChange={(e) => handleFilterChange('billtoFrom', e.target.value)}
                    placeholder="BillTo From"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.billtoTo}
                    onChange={(e) => handleFilterChange('billtoTo', e.target.value)}
                    placeholder="BillTo To"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.shiptoFrom}
                    onChange={(e) => handleFilterChange('shiptoFrom', e.target.value)}
                    placeholder="ShipTo From"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.shiptoTo}
                    onChange={(e) => handleFilterChange('shiptoTo', e.target.value)}
                    placeholder="ShipTo To"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.hqFrom}
                    onChange={(e) => handleFilterChange('hqFrom', e.target.value)}
                    placeholder="HQ From"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.hqTo}
                    onChange={(e) => handleFilterChange('hqTo', e.target.value)}
                    placeholder="HQ To"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.ssacctFrom}
                    onChange={(e) => handleFilterChange('ssacctFrom', e.target.value)}
                    placeholder="SSAcct From"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={filters.ssacctTo}
                    onChange={(e) => handleFilterChange('ssacctTo', e.target.value)}
                    placeholder="SSAcct To"
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                  />
                </td>
                <td className="px-3 py-1.5"></td>
              </tr>
            </thead>
            <tbody className="relative">
              {isLoading ? (
                <tr>
                  <td colSpan={12} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="size-5 animate-spin" />
                      Loading logs...
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={(log.logId ?? '') + (log.actionTimestamp ?? '')} className="border-b border-gray-100 hover:bg-blue-50/50">
                    <td className="px-3 py-2 text-sm text-gray-700 whitespace-nowrap">{formatTs(log.actionTimestamp)}</td>
                    <td className="px-3 py-2 text-sm font-medium text-gray-900">{log.action}</td>
                    <td className="px-3 py-2 text-sm text-gray-600">{log.rowNum ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{log.billtoFrom ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{log.billtoTo ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{log.shiptoFrom ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{log.shiptoTo ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{log.hqFrom ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{log.hqTo ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{log.ssacctFrom ?? '—'}</td>
                    <td className="px-3 py-2 text-sm text-gray-700">{log.ssacctTo ?? '—'}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => handleDeleteLog(log)}
                        disabled={deleteItem.isPending}
                        className="p-1 text-red-600 hover:bg-red-100 rounded disabled:opacity-50"
                        title="Delete log"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={12} className="px-6 py-20 text-center text-gray-500">
                    {hasActiveFilters ? 'No matches found.' : 'No logs yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
