import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Routes, Route } from 'react-router-dom';
import { Menu, Shield, LogOut, LogIn } from 'lucide-react';
import tuttleLogo from './assets/tuttlejpeg.jpg';
import SideNav from './components/ui/sidebar';
import { useAuth } from './contexts/AuthContext';
import { LoginDialog } from './components/auth/LoginDialog';
import HomePage from './pages/home/page';
import CustomerMappingPage from './pages/customer-mapping/page';
import BookPage from './pages/book-information/page';

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
  const { isAdmin, logout, isLoading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="h-screen flex flex-col">
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between gap-4">
              
              <div className='flex flex-row gap-4'>
                <img src={tuttleLogo} alt="Tuttle Publishing" className="h-12 w-12" />
                <div>
                  <h1 className="text-gray-900">Tuttle Publishing</h1>
                </div>
              </div>

              <div className="flex flex-row gap-2 items-center">
                {!isLoading && (
                  isAdmin ? (
                    <div className="flex items-center gap-2 bg-green-100 border border-green-300 rounded-lg px-3 py-2">
                      <Shield className="size-4 text-green-700" />
                      <span className="text-sm font-medium text-green-700">Admin</span>
                      <button
                        onClick={logout}
                        className="ml-1 p-1 text-green-700 hover:bg-green-200 rounded transition-colors"
                        title="Logout"
                      >
                        <LogOut className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLogin(true)}
                      className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
                    >
                      <LogIn className="size-4 text-gray-700" />
                      <span className="text-sm font-medium text-gray-700">Admin Login</span>
                    </button>
                  )
                )}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2"
                  aria-label="Toggle menu"
                >
                  <Menu className="size-5" />
                  <span>Menu</span>
                </button>
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
              <Route path="/book-information" element={<BookPage/>} />
            </Routes>
          </main>
        </div>
      </div>

      {showLogin && <LoginDialog onClose={() => setShowLogin(false)} />}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
