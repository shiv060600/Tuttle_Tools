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
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex gap-1 border-b border-gray-200'>
            <button 
              onClick={()=> {setMappingOpen(true); setLoggerOpen(false);}}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                mappingOpen 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}>
                Customer Mapping
            </button>
            <button 
              onClick={()=> {setLoggerOpen(true); setMappingOpen(false);}}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                loggerOpen 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}>
                Customer Mapping Log
            </button>
          </div>
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
