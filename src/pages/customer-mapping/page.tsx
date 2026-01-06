import { useState } from 'react';
import { CustomerMappingTable } from '@/components/customer-mapping/CustomerMappingTable';
import { LoggingTable } from '@/components/customer-mapping/LoggingTable';

export default function CustomerMappingPage() {
  const [activeTab, setActiveTab] = useState<'mappings' | 'logging'>('mappings');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-sm ${
            activeTab === 'mappings'
              ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl scale-100'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
          }`}
        >
          Customer Mappings
        </button>
        <button
          onClick={() => setActiveTab('logging')}
          className={`px-8 py-3 rounded-xl font-semibold transition-all shadow-sm ${
            activeTab === 'logging'
              ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl scale-100'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {activeTab === 'mappings' ? <CustomerMappingTable /> : <LoggingTable />}
    </main>
  );
}
