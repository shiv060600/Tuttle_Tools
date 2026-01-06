import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Routes, Route } from 'react-router-dom';
import { Menu } from 'lucide-react';
import tuttleLogo from './assets/tuttlejpeg.jpg';
import SideNav from './components/ui/sidebar';
import HomePage from './pages/home/page';
import CustomerMappingPage from './pages/customer-mapping/page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                aria-label="Toggle menu"
              >
                <Menu className="size-5" />
                <span>Menu</span>
              </button>
              <img src={tuttleLogo} alt="Tuttle Publishing" className="h-12 w-12" />
              <div>
                <h1 className="text-gray-900">Tuttle Publishing</h1>
                <p className="text-gray-600 mt-1">Customer Mapping Management</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <SideNav open={sidebarOpen} setOpen={setSidebarOpen} />

          <main className="flex-1 overflow-y-auto bg-gray-50">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/customer-mapping" element={<CustomerMappingPage />} />
            </Routes>
          </main>
        </div>
      </div>

      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
