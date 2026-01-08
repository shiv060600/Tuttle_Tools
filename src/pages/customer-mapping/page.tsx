import { useState } from 'react';
import { CustomerMappingTable } from '@/components/customer-mapping/CustomerMappingTable';
import { LoggingTable } from '@/components/customer-mapping/LoggingTable';
import { useAuth } from '@/contexts/AuthContext';
import { MappingType } from '@/types/customer-mapping';

export default function CustomerMappingPage() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'mappings' | 'logging'>('mappings');
  const [mappingType, setMappingType] = useState<MappingType>('original');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
      {/* Mapping Type Selector - Top, Large */}
      <div className="flex flex-row justify-center gap-2 mb-4">
        <button
          onClick={() => setMappingType('original')}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
            mappingType === 'original'
              ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
          }`}
        >
          Original
        </button>
        <button
          onClick={() => setMappingType('ips')}
          disabled={!isAdmin}
          className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all ${
            mappingType === 'ips'
              ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
          } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={!isAdmin ? 'Admin login required to access IPS Mapper' : ''}
        >
          IPS Mapper
        </button>
        <button
          disabled
          className="px-8 py-4 rounded-lg font-semibold text-lg transition-all opacity-50 cursor-not-allowed bg-white text-gray-700 border-2 border-gray-300"
          title="Coming soon"
        >
          ING Mapper
        </button>
      </div>

      {/* Tab Buttons - Below mapping selector, Small, Centered */}
      <div className="flex flex-row justify-center gap-2 mb-6 mt-10">
        <button
          onClick={() => setActiveTab('mappings')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'mappings'
              ? 'bg-sky-200 text-sky-900 shadow-md hover:bg-sky-300 hover:shadow-lg border-2 border-sky-400'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
          }`}
        >
          Customer Mappings
        </button>
        <button
          onClick={() => setActiveTab('logging')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'logging'
              ? 'bg-sky-200 text-sky-900 shadow-md hover:bg-sky-300 hover:shadow-lg border-2 border-sky-400'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Content Area - Flex grow to take available space */}
      <div className="flex-1 min-h-0">
        {activeTab === 'mappings' ? (
          <CustomerMappingTable mappingType={mappingType} />
        ) : (
          <LoggingTable loggingType={mappingType} />
        )}
      </div>
    </main>
  );
}
