import { useState } from 'react';
import { CustomerMappingTable } from '@/components/customer-mapping/CustomerMappingTable';
import { LoggingTable } from '@/components/customer-mapping/LoggingTable';

export default function CustomerMappingPage() {
  const [activeTab, setActiveTab] = useState<'mappings' | 'logging'>('mappings');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-row justify-between mb-6">
        <div className="flex flex-row gap-4">
          <button
            onClick={() => setActiveTab('mappings')}
            className={`p-2 px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'mappings'
                ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            Customer Mappings
          </button>
          <button
            onClick={() => setActiveTab('logging')}
            className={`p-2 px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'logging'
                ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl'
                : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {activeTab === 'mappings' ? <CustomerMappingTable /> : <LoggingTable />}
    </main>
  );
}
