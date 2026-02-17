import { useQuery } from "@tanstack/react-query";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const useBackorders = (isbn: string | null) => {
    return useQuery({
        queryKey: ['backorders', isbn],
        enabled: !!isbn,
        queryFn: async () => {
            const response = await fetch(`${API_BASE}/api/backorders/${isbn}`);    
            if (!response.ok) {
                throw new Error(`Failed to fetch backorders for ISBN ${isbn}`);
            }
            return response.json();

    }}); 
}

export { useBackorders }