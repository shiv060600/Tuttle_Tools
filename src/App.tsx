import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerMappingTable } from './components/CustomerMappingTable';
import { Toaster } from 'sonner@2.0.3';
import tuttleLogo from 'figma:asset/de641beac450d0641282ac56ffbe3ffc89a2c2c9.png';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={tuttleLogo} alt="Tuttle Publishing" className="h-12 w-12" />
                <div>
                  <h1 className="text-gray-900">Tuttle Publishing</h1>
                  <p className="text-gray-600 mt-1">Customer Mapping Management</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CustomerMappingTable />
        </main>
      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}