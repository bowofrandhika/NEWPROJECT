import { useParams, Link } from 'react-router-dom';
import { useProductionSession, useDowntimeRecords, useAcknowledgeDowntime, useResolveDowntime } from '../../../hooks';
import { ArrowLeft, Plus, Clock, Play, CheckCircle } from 'lucide-react';
import { formatDateTime, getStatusColor } from '../../../lib/utils';

export default function DowntimePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session } = useProductionSession(sessionId!);
  const { data: downtimes } = useDowntimeRecords(sessionId!);
  const acknowledgeDowntime = useAcknowledgeDowntime();
  const resolveDowntime = useResolveDowntime();

  const totalMinutes = downtimes?.reduce((sum, d) => sum + d.downtime_minutes, 0) || 0;
  const activeCount = downtimes?.filter(d => !['CLOSED', 'RESOLVED'].includes(d.status)).length || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/daily-instructions/${sessionId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module F - Downtime Management</h1>
            <p className="text-gray-500 text-sm">{session?.session_number || 'Loading...'}</p>
          </div>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Report Downtime
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Active Downtime" value={activeCount} />
        <SummaryCard label="Total Records" value={downtimes?.length || 0} />
        <SummaryCard label="Total Minutes" value={totalMinutes} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Downtime Records</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {downtimes && downtimes.length > 0 ? (
            downtimes.map((dt) => (
              <div key={dt.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{dt.downtime_type}</p>
                    <p className="text-sm text-gray-500">{dt.reason}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Start: {formatDateTime(dt.downtime_start)}</span>
                      {dt.downtime_end && <span>End: {formatDateTime(dt.downtime_end)}</span>}
                      <span>Duration: {dt.downtime_minutes} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(dt.status)}`}>
                      {dt.status}
                    </span>
                    <div className="flex items-center gap-1">
                      {dt.status === 'REPORTED' && (
                        <button
                          onClick={() => acknowledgeDowntime.mutateAsync(dt.id)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                          title="Acknowledge"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      {(dt.status === 'ACKNOWLEDGED' || dt.status === 'IN_PROGRESS') && (
                        <button
                          onClick={() => resolveDowntime.mutateAsync({ id: dt.id, resolution: 'Resolved' })}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Resolve"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No downtime records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
