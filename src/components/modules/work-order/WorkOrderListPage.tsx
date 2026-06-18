import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkOrders, useDeleteWorkOrder, useConfirmWOCompletion, useUnreadWONotifications, useMarkWONotificationRead } from '../../../hooks';
import { Plus, Search, Eye, CreditCard as Edit, Trash2, CheckCircle, Bell, AlertTriangle } from 'lucide-react';
import { formatDate, getStatusColor } from '../../../lib/utils';

export default function WorkOrderListPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const { data: workOrders, isLoading } = useWorkOrders();
  const { data: notifications } = useUnreadWONotifications();
  const deleteWorkOrder = useDeleteWorkOrder();
  const confirmCompletion = useConfirmWOCompletion();
  const markRead = useMarkWONotificationRead();

  const activeOrders = workOrders?.filter(o => o.status === 'ACTIVE' || o.status === 'DRAFT');
  const completedOrders = workOrders?.filter(o => o.status === 'COMPLETED' || o.status === 'CANCELLED');
  const currentOrders = activeTab === 'active' ? activeOrders : completedOrders;

  const filteredOrders = currentOrders?.filter(order =>
    search
      ? order.wo_number.toLowerCase().includes(search.toLowerCase()) ||
        order.batch_code.toLowerCase().includes(search.toLowerCase()) ||
        (order.buyer && order.buyer.toLowerCase().includes(search.toLowerCase()))
      : true
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      await deleteWorkOrder.mutateAsync(id);
    }
  };

  const handleConfirm = async (id: string) => {
    if (window.confirm('Confirm this work order as completed?')) {
      await confirmCompletion.mutateAsync(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
          <p className="text-gray-500 text-sm">Manage production work orders</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Bell className="w-5 h-5" />
            {notifications && notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
          <Link
            to="/work-orders/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Work Order
          </Link>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotificationPanel && notifications && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Completion Notifications</h3>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">No pending notifications</p>
          ) : (
            <div className="space-y-2">
              {notifications.map(n => (
                <div key={n.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-800">{n.message}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/work-orders/${n.work_order_id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => markRead.mutateAsync(n.id)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'active' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Active ({activeOrders?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'completed' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Completed ({completedOrders?.length || 0})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search work orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading work orders...</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WO Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packaging</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty (KG)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders?.map((wo) => (
                <tr key={wo.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/work-orders/${wo.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      {wo.wo_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{wo.buyer || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {wo.deadline_date ? formatDate(wo.deadline_date) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{wo.packaging || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {wo.quantity_kg.toLocaleString()} KG
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${wo.quantity_kg > 0 ? Math.min((wo.completed_kg / wo.quantity_kg) * 100, 100) : 0}%`
                        }}
                      ></div>
                    </div>
                    <span className="text-xs">{wo.completed_kg.toLocaleString()} KG</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(wo.status)}`}>
                      {wo.status}
                    </span>
                    {wo.notification_sent && !wo.wo_completion_confirmed && (
                      <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/work-orders/${wo.id}`} className="p-1 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link to={`/work-orders/${wo.id}?edit=true`} className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </Link>
                      {wo.notification_sent && !wo.wo_completion_confirmed && (
                        <button
                          onClick={() => handleConfirm(wo.id)}
                          className="p-1 text-green-500 hover:text-green-700"
                          title="Confirm completion"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(wo.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOrders?.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    No work orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
