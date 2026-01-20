import { useQuery,useQueryClient,useMutation } from "@tanstack/react-query";
import { LoggingBody, LogEntry } from "@/types/logging";
import { MappingType } from "@/types/customer-mapping";



const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const normalizeLog = (row: any): LogEntry => ({
    logId: row.LOG_ID ?? row.logId ?? row.log_id ?? null,
    rowNum: row.ROWNUM ?? row.rowNum ?? null,
    action: row.ACTION ?? row.action,
    billtoFrom: row.BILLTO_FROM ?? row.billto_from ?? null,
    shiptoFrom: row.SHIPTO_FROM ?? row.shipto_from ?? null,
    hqFrom: row.HQ_FROM ?? row.hq_from ?? null,
    ssacctFrom: row.SSACCT_FROM ?? row.ssacct_from ?? null,
    billtoTo: row.BILLTO_TO ?? row.billto_to ?? null,
    shiptoTo: row.SHIPTO_TO ?? row.shipto_to ?? null,
    hqTo: row.HQ_TO ?? row.hq_to ?? null,
    ssacctTo: row.SSACCT_TO ?? row.ssacct_to ?? null,
    actionTimestamp: row.ACTION_TIMESTAMP ?? row.action_timestamp ?? '',
});

const useLogging = (loggingType: MappingType = 'original') => {
    return useQuery({
        queryKey : ['logging', loggingType],
        queryFn : async(): Promise<LogEntry[]> => {
            const endpoint = loggingType === 'original' ? 'original' : loggingType;
            const response = await fetch(`${API_BASE}/api/logging/${endpoint}`,{
                method:'GET',
                credentials: 'include'
            })

            if(!response.ok){
                const err = await response.json();
                console.error(`error fetching from backend ${err.error}`);
                throw new Error(`error fetching form backend ${err.error}`)
            }

            const data = await response.json();
            return Array.isArray(data) ? data.map(normalizeLog) : [];
        }
    });
};

const useDeleteOldLogs = (loggingType: MappingType = 'original') => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async(days: Number) => {
            if(typeof days != 'number'){
                throw new Error('rowNum must be number')
            };

            const endpoint = loggingType === 'original' ? 'original' : loggingType;
            const response = await fetch(`${API_BASE}/api/logging/${endpoint}/${days}`,{
                method:'DELETE',
                credentials: 'include'
            });

            if(!response.ok){
                const err = await response.json();
                throw new Error(`failed to delete from logging table ${err.error}`);
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:['logging', loggingType]})
        }
    });
}

const useDeleteLogItem = (loggingType: MappingType = 'original') => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async(logId: string) => {
            if (!logId) {
                throw new Error('logId is required');
            }

            const endpoint = loggingType === 'original' ? 'original' : loggingType;
            const response = await fetch(`${API_BASE}/api/logging/${endpoint}/id/${logId}`, { 
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'failed to delete log item');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logging', loggingType] });
        }
    });
};

const useCreateLog = (loggingType: MappingType = 'original') => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async(payload: LoggingBody) => {
            const endpoint = loggingType === 'original' ? 'original' : loggingType;
            const response = await fetch(`${API_BASE}/api/logging/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'failed to create log entry');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logging', loggingType] });
        }
    });
};







export {
    useLogging,
    useDeleteOldLogs,
    useDeleteLogItem,
    useCreateLog
}
