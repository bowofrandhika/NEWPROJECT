import { useParams, Link } from 'react-router-dom';
import { useProductionSession, useBottleneckRecords, useResolveBottleneck } from '../../../hooks';
import { ArrowLeft, Plus, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDateTime, getStatusColor } from '../../../lib/utils';

export default function BottleneckPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session } = useProductionSession(sessionId!);
  const { data: bottlenecks } = useBottleneckRecords(sessionId!);
  const resolveBottleneck = useResolveBottleneck();

  const activeCount = bottlenecks?.filter(b => b.status !== 'RESOLVED').length || 0;
  const totalImpact = bottlenecks?.reduce((sum, b) => sum + b.impact_duration_minutes, 0) || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/daily-instructions/${sessionId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module E - Bottleneck Management</h1>
            <p className="text-gray-500 text-sm">{session?.session_number || 'Loading...'}</p>
          </div>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Report Bottleneck
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Active Issues" value={activeCount} color="text-red-600" />
        <SummaryCard label="Total Issues" value={bottlenecks?.length || 0} color="text-blue-600" />
        <SummaryCard label="Total Impact" value={`${totalImpact} min`} color="text-orange-600" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bottleneck Records</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {bottlenecks && bottlenecks.length > 0 ? (
            bottlenecks.map((bn) => (
              <div key={bn.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{bn.bottleneck_type}</p>
                    <p className="text-sm text-gray-500">{bn.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDateTime(bn.bottleneck_time)} - Impact: {bn.impact_duration_minutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bn.severity)}`}>
                      {bn.severity}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bn.status)}`}>
                      {bn.status}
                    </span>
                    {bn.status !== 'RESOLVED' && (
                      <button
                        onClick={() => resolveBottleneck.mutateAsync({ id: bn.id })}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No bottleneck records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
