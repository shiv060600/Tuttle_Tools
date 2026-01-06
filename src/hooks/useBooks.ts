import { useQuery } from '@tanstack/react-query';
import { Book } from '../types/books';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useBook = (isbn: string | null) => {
  return useQuery({
    queryKey: ['book', isbn],
    queryFn: async (): Promise<Book | null> => {
      if (!isbn || isbn.trim() === '') {
        return null;
      }

      const response = await fetch(`${API_BASE}/api/books/${isbn}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        if (response.status === 404) {
            console.log('404')
          return null;
        }
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to fetch book');
      }

      const result = await response.json();
      return result.data || null;
    },
    enabled: !!isbn && isbn.trim() !== '', // Only run query if ISBN is provided
    retry: false
  });
};