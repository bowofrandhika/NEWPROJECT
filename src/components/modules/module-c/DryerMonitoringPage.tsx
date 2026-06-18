import { useParams, Link } from 'react-router-dom';
import { useProductionSession, useDryerMonitorings, useRejectRecords, useDryers } from '../../../hooks';
import { ArrowLeft, Plus, Thermometer, Gauge } from 'lucide-react';
import { formatDateTime } from '../../../lib/utils';

export default function DryerMonitoringPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session } = useProductionSession(sessionId!);
  const { data: dryerMonitorings } = useDryerMonitorings(sessionId!);
  const { data: rejects } = useRejectRecords(sessionId!);
  const { data: dryers } = useDryers();

  const totalRejects = rejects?.reduce((sum, r) => sum + r.reject_qty, 0) || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/daily-instructions/${sessionId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module C - Dryer Monitoring</h1>
            <p className="text-gray-500 text-sm">{session?.session_number || 'Loading...'}</p>
          </div>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Start Monitoring
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Dryer Sessions</h2>
          </div>
          <div className="p-4">
            {dryerMonitorings && dryerMonitorings.length > 0 ? (
              <div className="space-y-4">
                {dryerMonitorings.map((dm) => (
                  <div key={dm.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">
                        {(dm as { dryers?: { dryer_name: string } }).dryers?.dryer_name || 'Unknown Dryer'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        dm.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {dm.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Cycle: {dm.cycle_number}</p>
                    <p className="text-sm text-gray-500">Started: {dm.start_time ? formatDateTime(dm.start_time) : '-'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Gauge className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No active dryer sessions</p>
                <button className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Start Monitoring
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Reject Summary</h3>
            <div className="text-3xl font-bold text-red-600 mb-2">{totalRejects}</div>
            <p className="text-sm text-gray-500">Total rejects this session</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Dryers</h3>
            <div className="space-y-2">
              {dryers?.slice(0, 5).map((dryer) => (
                <div key={dryer.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <Thermometer className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{dryer.dryer_name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
