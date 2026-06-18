import { useWorkOrders, useProductionSessions } from '../../../hooks';
import { FileText, Download } from 'lucide-react';
import { formatDate } from '../../../lib/utils';

export default function ReportsPage() {
  const { data: workOrders } = useWorkOrders();
  const { data: sessions } = useProductionSessions();

  const reports = [
    {
      name: 'Production Summary Report',
      description: 'Daily production summary by shift and line',
      type: 'production'
    },
    {
      name: 'Quality Report',
      description: 'Quality metrics including pass rate and defects',
      type: 'quality'
    },
    {
      name: 'OEE Report',
      description: 'Overall Equipment Effectiveness metrics',
      type: 'oee'
    },
    {
      name: 'Downtime Report',
      description: 'Downtime analysis by type and category',
      type: 'downtime'
    },
    {
      name: 'Reject Report',
      description: 'Reject analysis by type and disposition',
      type: 'reject'
    },
    {
      name: 'Audit Trail',
      description: 'Complete audit log of all activities',
      type: 'audit'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-sm">Generate and export production reports</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Work Orders</p>
          <p className="text-2xl font-bold text-gray-900">{workOrders?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Sessions</p>
          <p className="text-2xl font-bold text-blue-600">{sessions?.filter(s => s.status === 'ACTIVE').length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold text-green-600">{sessions?.filter(s => s.status === 'COMPLETED').length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-900">{sessions?.filter(s => {
            const sessionDate = new Date(s.session_date);
            const now = new Date();
            return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
          }).length || 0}</p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div
            key={report.name}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <button className="p-2 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                <Download className="w-5 h-5" />
              </button>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
            <p className="text-sm text-gray-500">{report.description}</p>
            <button className="mt-4 w-full py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50">
              Generate Report
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
