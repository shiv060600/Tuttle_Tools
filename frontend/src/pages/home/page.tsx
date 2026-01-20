import { BookA,  Database, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white flex flex-col gap-5 rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col text-center gap-5">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 mt-10">
            Welcome to Customer Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage customer account mappings and track all changes with comprehensive audit logging.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 p-3">
          <div className="flex flex-col gap-3 p-6 bg-blue-50 rounded-lg border border-blue-400">
            <div className="flex items-center gap-3 mb-3">
              <Database className="size-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Customer Mappings</h2>
            </div>
            <p className="text-gray-700">
              View, create, edit, and delete customer account mappings. 
              Search and filter through records with real-time updates.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 bg-blue-50 rounded-lg border border-blue-400">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="size-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
            </div>
            <p className="text-gray-700">
              Complete history of all mapping changes including creates, updates, and deletions. 
              Filter by action type and manage log retention.
            </p>
          </div>

          <div className="flex flex-col gap-3 p-6 bg-blue-50 rounded-lg border border-blue-400">
            <div className="flex items-center gap-3 mb-3">
              <BookA className="size-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Book Information</h2>
            </div>
            <p className="text-gray-700">
              Search for book details by ISBN. View comprehensive information including title, 
              publication date, pricing, inventory, and more.
            </p>
          </div>
        </div>

        <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            <strong>Tip:</strong> Click the menu icon in the top-right to open the navigation sidebar.
          </p>
        </div>
      </div>
    </main>
  );
}

