import { useParams, Link } from 'react-router-dom';
import {
  usePreProductionChecklist, useCreatePreProductionChecklist, useApprovePreProductionChecklist,
  useChecklistItems, useCheckChecklistItem, useToolsInspections, useCreateToolsInspection,
  useManpowerRecords, useCreateManpowerRecord, useProductionSession
} from '../../../hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { manpowerRecordSchema, type ManpowerRecordFormData } from '../../../schemas';
import { ArrowLeft, Check, Plus, X, Settings, Users, Wrench } from 'lucide-react';
import { formatDateTime, getStatusColor } from '../../../lib/utils';

export default function PreProductionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session } = useProductionSession(sessionId!);
  const { data: checklist } = usePreProductionChecklist(sessionId!);
  const { data: checklistItems } = useChecklistItems(checklist?.id || '');
  const { data: toolsInspections } = useToolsInspections(sessionId!);
  const { data: manpowerRecords } = useManpowerRecords(sessionId!);

  const createChecklist = useCreatePreProductionChecklist();
  const approveChecklist = useApprovePreProductionChecklist();
  const checkItem = useCheckChecklistItem();
  const createToolsInspection = useCreateToolsInspection();
  const createManpowerRecord = useCreateManpowerRecord();

  const [showManpowerForm, setShowManpowerForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ManpowerRecordFormData>({
    resolver: zodResolver(manpowerRecordSchema)
  });

  const handleCreateChecklist = async () => {
    if (sessionId) {
      await createChecklist.mutateAsync({
        production_session_id: sessionId,
        checklist_date: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleCheckItem = async (itemId: string, isChecked: boolean) => {
    await checkItem.mutateAsync({ id: itemId, isChecked });
  };

  const handleApprove = async () => {
    if (checklist && window.confirm('Approve this checklist?')) {
      await approveChecklist.mutateAsync(checklist.id);
    }
  };

  const onManpowerSubmit = async (data: ManpowerRecordFormData) => {
    await createManpowerRecord.mutateAsync({
      ...data,
      production_session_id: sessionId!
    });
    reset();
    setShowManpowerForm(false);
  };

  const defaultChecklistItems = [
    { item_name: 'Safety equipment checked', category: 'Safety', sort_order: 1 },
    { item_name: 'Machine guards in place', category: 'Safety', sort_order: 2 },
    { item_name: 'Emergency stops functional', category: 'Safety', sort_order: 3 },
    { item_name: 'PPE available', category: 'Safety', sort_order: 4 },
    { item_name: 'Work area clean', category: 'Housekeeping', sort_order: 5 },
    { item_name: 'Materials properly stored', category: 'Housekeeping', sort_order: 6 },
    { item_name: 'Ventilation working', category: 'Environment', sort_order: 7 },
    { item_name: 'Lighting adequate', category: 'Environment', sort_order: 8 }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/daily-instructions/${sessionId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module A - Pre-Production</h1>
            <p className="text-gray-500 text-sm">{session?.session_number || 'Loading...'}</p>
          </div>
        </div>
        {checklist && checklist.status === 'PENDING' && (
          <button
            onClick={handleApprove}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Approve Checklist
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <TabButton active>Checklist</TabButton>
        <TabButton>Tools Inspection</TabButton>
        <TabButton active>Manpower</TabButton>
      </div>

      {/* Checklist Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pre-Production Checklist</h2>
            {checklist && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(checklist.status)}`}>
                {checklist.status}
              </span>
            )}
          </div>

          {!checklist ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No checklist created for this session</p>
              <button
                onClick={handleCreateChecklist}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Checklist
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {checklistItems && checklistItems.length > 0 ? (
                checklistItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      item.is_checked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCheckItem(item.id, !item.is_checked)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          item.is_checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}
                      >
                        {item.is_checked && <Check className="w-4 h-4 text-white" />}
                      </button>
                      <span className={item.is_checked ? 'line-through text-gray-500' : 'text-gray-900'}>
                        {item.item_name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{item.category}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No checklist items</p>
              )}
            </div>
          )}
        </div>

        {/* Tools Inspection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tools Inspection</h2>
          <div className="space-y-2">
            {toolsInspections && toolsInspections.length > 0 ? (
              toolsInspections.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{tool.tool_name}</p>
                    <p className="text-xs text-gray-500">{tool.tool_code}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    tool.condition_status === 'GOOD' ? 'bg-green-100 text-green-800' :
                    tool.condition_status === 'NEEDS_REPAIR' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tool.condition_status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No tools inspected</p>
            )}
          </div>
        </div>

        {/* Manpower */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Manpower & Attendance</h2>
            <button
              onClick={() => setShowManpowerForm(!showManpowerForm)}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              {showManpowerForm ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {showManpowerForm ? 'Cancel' : 'Add Person'}
            </button>
          </div>

          {showManpowerForm && (
            <form onSubmit={handleSubmit(onManpowerSubmit)} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <input
                    {...register('operator_name')}
                    placeholder="Operator Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {errors.operator_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.operator_name.message}</p>
                  )}
                </div>
                <div>
                  <input
                    {...register('position')}
                    placeholder="Position"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <select
                    {...register('attendance_status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="LEAVE">Leave</option>
                    <option value="SICK">Sick</option>
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          )}

          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Position</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Clock In</th>
                <th className="text-left py-2 text-sm font-medium text-gray-500">Clock Out</th>
              </tr>
            </thead>
            <tbody>
              {manpowerRecords && manpowerRecords.length > 0 ? (
                manpowerRecords.map((mp) => (
                  <tr key={mp.id} className="border-b border-gray-100">
                    <td className="py-2 text-sm text-gray-900">{mp.operator_name}</td>
                    <td className="py-2 text-sm text-gray-500">{mp.position}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        mp.attendance_status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                        mp.attendance_status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {mp.attendance_status}
                      </span>
                    </td>
                    <td className="py-2 text-sm text-gray-500">
                      {mp.clock_in_time ? formatDateTime(mp.clock_in_time) : '-'}
                    </td>
                    <td className="py-2 text-sm text-gray-500">
                      {mp.clock_out_time ? formatDateTime(mp.clock_out_time) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No manpower records
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

function TabButton({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-lg ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}
