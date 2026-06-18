import { AuditLog } from '../../../types/database';
import { FileText } from 'lucide-react';
import { formatDateTime } from '../../../lib/utils';

export default function AuditLogPage() {
  // Placeholder for audit logs - would need a hook to fetch real data
  const auditLogs: AuditLog[] = [];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-500 text-sm">System activity and change history</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>

        {auditLogs.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{log.action}</p>
                    <p className="text-sm text-gray-500">{log.table_name}</p>
                  </div>
                  <span className="text-sm text-gray-500">{formatDateTime(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs available</p>
            <p className="text-sm text-gray-400 mt-1">Activities will be logged here automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}
