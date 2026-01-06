import { ArrowRight, Database, FileText } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Customer Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage customer account mappings and track all changes with comprehensive audit logging.
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="flex items-center gap-2 text-blue-600">
            <ArrowRight className="size-5" />
            <span className="text-lg font-medium">Use the sidebar to access different pages</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Database className="size-8 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Customer Mappings</h2>
            </div>
            <p className="text-gray-700">
              View, create, edit, and delete customer account mappings. 
              Search and filter through records with real-time updates.
            </p>
          </div>

          <div className="p-6 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="size-8 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Audit Logs</h2>
            </div>
            <p className="text-gray-700">
              Complete history of all mapping changes including creates, updates, and deletions. 
              Filter by action type and manage log retention.
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            <strong>Tip:</strong> Click the menu icon in the top-left to open the navigation sidebar.
          </p>
        </div>
      </div>
    </main>
  );
}

