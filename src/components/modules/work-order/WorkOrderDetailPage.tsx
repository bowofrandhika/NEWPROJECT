import { useParams, Link } from 'react-router-dom';
import { useWorkOrder, useProductionSessions } from '../../../hooks';
import { ArrowLeft, CreditCard as Edit, ClipboardList, Calendar, Package, Hash } from 'lucide-react';
import { formatDate, getStatusColor } from '../../../lib/utils';

export default function WorkOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: workOrder, isLoading } = useWorkOrder(id!);
  const { data: sessions } = useProductionSessions();

  const relatedSessions = sessions?.filter(s => s.work_order_id === id);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Work order not found</p>
        <Link to="/work-orders" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Work Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/work-orders" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{workOrder.wo_number}</h1>
            <p className="text-gray-500 text-sm">{workOrder.batch_code || workOrder.wo_date}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(workOrder.status)}`}>
            {workOrder.status}
          </span>
          <Link
            to={`/work-orders/${id}?edit=true`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Work Order Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={ClipboardList} label="WO Number" value={workOrder.wo_number} />
              <InfoItem icon={Calendar} label="WO Date" value={formatDate(workOrder.wo_date)} />
              <InfoItem icon={Package} label="Product" value={(workOrder as { products?: { product_name: string } }).products?.product_name || '-'} />
              <InfoItem icon={Hash} label="Batch Code" value={workOrder.batch_code || '-'} />
            </div>
          </div>

          {/* Production Progress */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Production Progress</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Target Quantity</span>
                <span className="font-medium">{(workOrder.target_qty ?? 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completed Quantity</span>
                <span className="font-medium text-green-600">{workOrder.completed_qty.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-green-500 h-4 rounded-full"
                  style={{
                    width: `${Math.min((workOrder.completed_qty / (workOrder.target_qty || 1)) * 100, 100)}%`
                  }}
                ></div>
              </div>
              <div className="text-center text-sm text-gray-500">
                {((workOrder.completed_qty / (workOrder.target_qty || 1)) * 100).toFixed(1)}% Completed
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Priority</span>
                <span className="font-medium">{workOrder.priority || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Planned Start</span>
                <span className="font-medium">{workOrder.planned_start_date ? formatDate(workOrder.planned_start_date) : '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Planned End</span>
                <span className="font-medium">{workOrder.planned_end_date ? formatDate(workOrder.planned_end_date) : '-'}</span>
              </div>
            </div>
          </div>

          {/* Related Sessions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Production Sessions</h3>
            {relatedSessions && relatedSessions.length > 0 ? (
              <ul className="space-y-2">
                {relatedSessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      to={`/daily-instructions/${session.id}`}
                      className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-200"
                    >
                      <p className="text-sm font-medium text-gray-900">{session.session_number}</p>
                      <p className="text-xs text-gray-500">{formatDate(session.session_date)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No production sessions linked</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
