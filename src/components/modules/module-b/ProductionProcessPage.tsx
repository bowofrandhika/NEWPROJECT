import { useParams, Link } from 'react-router-dom';
import { useProductionSession, useProductionLogs, useCreateProductionLog, useOutputSummary, useCreateOutputSummary, useFuelConsumptions, useCreateFuelConsumption } from '../../../hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Plus, BarChart3, Fuel, Package } from 'lucide-react';
import { formatDateTime } from '../../../lib/utils';

export default function ProductionProcessPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session } = useProductionSession(sessionId!);
  const { data: logs } = useProductionLogs(sessionId!);
  const { data: outputSummary } = useOutputSummary(sessionId!);
  const { data: fuelConsumptions } = useFuelConsumptions(sessionId!);

  const createLog = useCreateProductionLog();
  const createOutputSummary = useCreateOutputSummary();
  const createFuel = useCreateFuelConsumption();

  const [showLogForm, setShowLogForm] = useState(false);

  const totalInput = logs?.reduce((sum, l) => sum + l.input_qty, 0) || 0;
  const totalOutput = logs?.reduce((sum, l) => sum + l.output_qty, 0) || 0;
  const totalReject = logs?.reduce((sum, l) => sum + l.reject_qty, 0) || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/daily-instructions/${sessionId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module B - Production Process</h1>
            <p className="text-gray-500 text-sm">{session?.session_number || 'Loading...'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowLogForm(!showLogForm)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Log
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <SummaryCard label="Total Input" value={totalInput} icon={Package} color="bg-blue-500" />
        <SummaryCard label="Total Output" value={totalOutput} icon={Package} color="bg-green-500" />
        <SummaryCard label="Total Reject" value={totalReject} icon={Package} color="bg-red-500" />
        <SummaryCard label="Yield" value={`${totalInput > 0 ? ((totalOutput / totalInput) * 100).toFixed(1) : 0}%`} icon={BarChart3} color="bg-purple-500" />
      </div>

      {/* Production Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Production Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Process Step</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Input</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Output</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDateTime(log.log_time)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.process_step || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{log.input_qty}</td>
                    <td className="px-6 py-4 text-sm text-green-600 font-medium">{log.output_qty}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{log.reject_qty}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.remarks || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No production logs
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fuel Consumption */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Fuel className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold text-gray-900">Fuel Consumption</h2>
        </div>
        {fuelConsumptions && fuelConsumptions.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {fuelConsumptions.map((fuel) => (
              <div key={fuel.id} className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">{fuel.fuel_type}</p>
                <p className="text-lg font-bold text-gray-900">{fuel.consumed_qty} {fuel.unit}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No fuel consumption records</p>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
