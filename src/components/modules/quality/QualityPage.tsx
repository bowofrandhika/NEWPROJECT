import { useInspections, useDefects, useCAPAs } from '../../../hooks';
import { Shield, AlertTriangle, CheckCircle, Plus } from 'lucide-react';
import { formatDate, getStatusColor } from '../../../lib/utils';

export default function QualityPage() {
  const { data: inspections } = useInspections();
  const { data: defects } = useDefects();
  const { data: capas } = useCAPAs();

  const pendingInspections = inspections?.filter(i => i.status === 'DRAFT' || i.status === 'SUBMITTED').length || 0;
  const openDefects = defects?.filter(d => d.status === 'OPEN' || d.status === 'IN_PROGRESS').length || 0;
  const openCAPAs = capas?.filter(c => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quality Management</h1>
          <p className="text-gray-500 text-sm">Inspections, defects, and CAPA tracking</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Inspection
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <Shield className="w-10 h-10 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Pending Inspections</p>
              <p className="text-2xl font-bold text-gray-900">{pendingInspections}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="w-10 h-10 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-500">Open Defects</p>
              <p className="text-2xl font-bold text-yellow-600">{openDefects}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="w-10 h-10 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Open CAPAs</p>
              <p className="text-2xl font-bold text-gray-900">{openCAPAs}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium">Inspections</button>
        <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Defects</button>
        <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">CAPA</button>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Inspections</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pass Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inspections && inspections.length > 0 ? (
                inspections.slice(0, 10).map((inspection) => (
                  <tr key={inspection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(inspection.inspection_date)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{inspection.inspection_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{inspection.sample_qty}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{inspection.pass_rate?.toFixed(1) || 0}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inspection.inspection_result === 'PASSED' ? 'bg-green-100 text-green-800' :
                        inspection.inspection_result === 'FAILED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inspection.inspection_result}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                        {inspection.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No inspections found
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
