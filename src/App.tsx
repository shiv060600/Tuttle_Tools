import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CustomerMappingTable } from './components/CustomerMappingTable';
import { LoggingTable } from './components/LoggingTable';
import { useState } from 'react';
import { Toaster } from 'sonner';
import tuttleLogo from './assets/tuttlejpeg.jpg';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    },
  },
});

export default function App() {
  const [mappingOpen,setMappingOpen] = useState(true);
  const [loggerOpen,setLoggerOpen] = useState(false);
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
        <div className='flex flex-col px-4 gap-2'>
          <button 
            disabled={mappingOpen} 
            onClick={()=> {setMappingOpen(true); setLoggerOpen(false);}}
            className="px-3 py-2 text-left bg-white border border-gray-200 rounded disabled:opacity-60 hover:bg-gray-50">
              Customer Mapping
          </button>
          <button 
            disabled={loggerOpen} 
            onClick={()=> {setLoggerOpen(true); setMappingOpen(false);}}
            className="px-3 py-2 text-left bg-white border border-gray-200 rounded disabled:opacity-60 hover:bg-gray-50">
              Customer Mapping Log
          </button>
        </div>
        { mappingOpen &&
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CustomerMappingTable />
        </main>
        }
        {loggerOpen && 
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoggingTable />
        </main>
        }

      </div>
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
