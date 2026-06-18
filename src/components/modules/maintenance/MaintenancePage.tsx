import { useMaintenanceSchedules, useOverdueMaintenance, useMaintenanceRecords } from '../../../hooks';
import { Clock, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { formatDate, getStatusColor } from '../../../lib/utils';

export default function MaintenancePage() {
  const { data: schedules } = useMaintenanceSchedules();
  const { data: overdue } = useOverdueMaintenance();
  const { data: records } = useMaintenanceRecords();

  const activeCount = schedules?.filter(s => s.status === 'ACTIVE').length || 0;
  const overdueCount = overdue?.length || 0;
  const completedCount = records?.filter(r => r.status === 'COMPLETED' || r.status === 'VERIFIED').length || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-500 text-sm">Preventive and corrective maintenance tracking</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Schedule
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <Clock className="w-10 h-10 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Active Schedules</p>
              <p className="text-2xl font-bold text-gray-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 bg-red-50">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert */}
      {overdue && overdue.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="font-medium text-red-800">Overdue Maintenance</span>
          </div>
          <p className="text-sm text-red-600">
            {overdue.length} maintenance schedule(s) are overdue. Please take action.
          </p>
        </div>
      )}

      {/* Maintenance Schedules Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Maintenance Schedules</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedules && schedules.length > 0 ? (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{schedule.equipment_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{schedule.maintenance_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(schedule.next_maintenance_date)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.priority)}`}>
                        {schedule.priority}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No maintenance schedules
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
