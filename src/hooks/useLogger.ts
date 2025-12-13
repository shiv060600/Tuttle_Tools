import { useQuery,useQueryClient,useMutation } from "@tanstack/react-query";
import { LoggingBody } from "@/types/logging";



const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const useLogging = () => {
    return useQuery({
        queryKey : ['logging'],
        queryFn : async(): Promise<LoggingBody[]> => {


            const response = await fetch(`${API_BASE}/api/logging`,{method:'GET'})

            if(!response.ok){
                const err = await response.json();
                console.error(`error fetching from backend ${err.error}`);
                throw new Error(`error fetching form backend ${err.error}`)
            }

            return response.json();
        }
    });
};

const useDeleteLogging = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async(days: Number) => {
            if(typeof days != 'number'){
                throw new Error('rowNum must be number')
            };

            const response = await fetch(`${API_BASE}/api/logging/${days}`,{method:'DELETE'});

            if(!response.ok){
                const err = await response.json();
                throw new Error(`failed to delete from logging table ${err.error}`);
            }

            return response
        },
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey:['logging']})
        }
    });
}

const useUpdateLogging = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async(payload: LoggingBody) => {
            if (payload.action !== 'edit') {
                throw new Error("action must be 'edit' for update");
            }
            if (payload.rowNum === null || payload.rowNum === undefined || Number.isNaN(Number(payload.rowNum))) {
                throw new Error('rowNum is required for update');
            }

            const response = await fetch(`${API_BASE}/api/logging`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'failed to update log entry');
            }

            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['logging'] });
        }
    });
};






export {
    useLogging,
    useDeleteLogging,
    useUpdateLogging
}
