import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';

export default function TraceabilityPage() {
  const [batchCode, setBatchCode] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchPerformed(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Batch Traceability</h1>
        <p className="text-gray-500 text-sm">Track batches from material to finished goods</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={batchCode}
              onChange={(e) => setBatchCode(e.target.value)}
              placeholder="Enter batch code to trace..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Trace Batch
          </button>
        </form>
      </div>

      {/* Traceability Visualization */}
      {searchPerformed && batchCode && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Traceability Flow</h2>
          <div className="flex items-center justify-center gap-4 overflow-x-auto py-4">
            <TraceNode title="Material" status="completed" label={batchCode} />
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0" />
            <TraceNode title="Input" status="completed" label="Dryer Input" />
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0" />
            <TraceNode title="Dryer" status="active" label="Dryer #1" />
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0" />
            <TraceNode title="Output" status="pending" label="Pending" />
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0" />
            <TraceNode title="Pallet" status="pending" label="Pending" />
            <ArrowRight className="w-8 h-8 text-gray-400 flex-shrink-0" />
            <TraceNode title="Ship" status="pending" label="Pending" />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Material Info</h3>
              <p className="text-xs text-gray-500">Batch: {batchCode}</p>
              <p className="text-xs text-gray-500">Received: -</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Process Info</h3>
              <p className="text-xs text-gray-500">Line: -</p>
              <p className="text-xs text-gray-500">Date: -</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quality Info</h3>
              <p className="text-xs text-gray-500">Status: -</p>
              <p className="text-xs text-gray-500">Inspection: -</p>
            </div>
          </div>
        </div>
      )}

      {!searchPerformed && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">Enter a batch code to trace</p>
          <p className="text-sm text-gray-400">Trace from raw material to finished product</p>
        </div>
      )}
    </div>
  );
}

function TraceNode({ title, status, label }: { title: string; status: 'completed' | 'active' | 'pending'; label: string }) {
  const colors = {
    completed: 'bg-green-500',
    active: 'bg-blue-500',
    pending: 'bg-gray-300'
  };

  return (
    <div className="flex flex-col items-center min-w-[100px]">
      <div className={`w-12 h-12 rounded-full ${colors[status]} flex items-center justify-center mb-2`}>
        {status === 'completed' && (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-gray-900">{title}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}
