import { useParams, Link } from 'react-router-dom';
import { useProductionSession, usePreProductionChecklist, useOutputSummary, useDowntimeRecords, useRejectRecords } from '../../../hooks';
import { ArrowLeft, CreditCard as Edit, Settings, Package, Gauge, AlertTriangle, Clock, BarChart3 } from 'lucide-react';
import { formatDate, getStatusColor } from '../../../lib/utils';

export default function DailyInstructionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session, isLoading: sessionLoading } = useProductionSession(id!);
  const { data: checklist } = usePreProductionChecklist(id!);
  const { data: outputSummary } = useOutputSummary(id!);
  const { data: downtimes } = useDowntimeRecords(id!);
  const { data: rejects } = useRejectRecords(id!);

  if (sessionLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Production session not found</p>
        <Link to="/daily-instructions" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Daily Instructions
        </Link>
      </div>
    );
  }

  const totalDowntime = downtimes?.reduce((sum, d) => sum + (d.downtime_minutes || 0), 0) || 0;
  const totalRejects = rejects?.reduce((sum, r) => sum + r.reject_qty, 0) || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/daily-instructions" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.session_number}</h1>
            <p className="text-gray-500 text-sm">{formatDate(session.session_date)} - {session.batch}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
            {session.status}
          </span>
          <Link
            to={`/daily-instructions/${id}?edit=true`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <ModuleLink
          to={`/pre-production/${id}`}
          icon={Settings}
          label="Module A"
          title="Pre-Production"
          color="bg-purple-500"
        />
        <ModuleLink
          to={`/production/${id}`}
          icon={Package}
          label="Module B"
          title="Production Process"
          color="bg-blue-500"
        />
        <ModuleLink
          to={`/dryer/${id}`}
          icon={Gauge}
          label="Module C"
          title="Dryer Monitoring"
          color="bg-teal-500"
        />
        <ModuleLink
          to={`/packing/${id}`}
          icon={Package}
          label="Module D"
          title="Packing"
          color="bg-indigo-500"
        />
        <ModuleLink
          to={`/bottleneck/${id}`}
          icon={AlertTriangle}
          label="Module E"
          title="Bottleneck"
          color="bg-orange-500"
        />
        <ModuleLink
          to={`/downtime/${id}`}
          icon={Clock}
          label="Module F"
          title="Downtime"
          color="bg-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Shift</p>
                <p className="text-lg font-medium text-gray-900">
                  {(session as { shifts?: { shift_name: string } }).shifts?.shift_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Line</p>
                <p className="text-lg font-medium text-gray-900">
                  {(session as { lines?: { line_name: string } }).lines?.line_name || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Buyer</p>
                <p className="text-lg font-medium text-gray-900">
                  {(session as { buyers?: { buyer_name: string } }).buyers?.buyer_name || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Production Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Production Progress</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Target Production</span>
                <span className="text-2xl font-bold text-gray-900">{session.target_production.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Actual Production</span>
                <span className="text-2xl font-bold text-green-600">{session.actual_production.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full transition-all"
                  style={{
                    width: `${Math.min((session.actual_production / session.target_production) * 100 || 0, 100)}%`
                  }}
                ></div>
              </div>
              <div className="text-center text-gray-500">
                {((session.actual_production / session.target_production) * 100 || 0).toFixed(1)}% Completed
              </div>
            </div>
          </div>

          {/* Output Summary */}
          {outputSummary && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Output Summary</h2>
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total Input" value={outputSummary.total_input} />
                <StatCard label="Total Output" value={outputSummary.total_output} />
                <StatCard label="Good Output" value={outputSummary.total_good} color="text-green-600" />
                <StatCard label="Reject" value={outputSummary.total_reject} color="text-red-600" />
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pre-Production Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Pre-Production Checklist</h3>
            {checklist ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(checklist.status)}`}>
                    {checklist.status}
                  </span>
                </div>
                <Link
                  to={`/pre-production/${id}`}
                  className="block mt-4 text-center text-sm text-blue-600 hover:underline"
                >
                  View Checklist
                </Link>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">No checklist created</p>
                <Link
                  to={`/pre-production/${id}`}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Checklist
                </Link>
              </div>
            )}
          </div>

          {/* Issues Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Issues Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Downtime</span>
                </div>
                <span className="font-medium">{totalDowntime} min</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Rejects</span>
                </div>
                <span className="font-medium">{totalRejects}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link
                to={`/oee?session=${id}`}
                className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <BarChart3 className="w-4 h-4" />
                OEE Report
              </Link>
              <Link
                to={`/traceability?session=${id}`}
                className="flex items-center gap-2 p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                <Package className="w-4 h-4" />
                Batch Traceability
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModuleLink({ to, icon: Icon, label, title, color }: {
  to: string;
  icon: React.ElementType;
  label: string;
  title: string;
  color: string;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center mb-2`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <span className="text-xs font-medium text-gray-900">{label}</span>
      <span className="text-xs text-gray-500">{title}</span>
    </Link>
  );
}

function StatCard({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) {
  return (
    <div className="text-center p-3 rounded-lg bg-gray-50">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value.toLocaleString()}</p>
    </div>
  );
}
