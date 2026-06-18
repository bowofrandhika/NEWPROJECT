import { useParams, Link } from 'react-router-dom';
import { useProductionSessions, useProductionSession, useSessionChecklistItems, useCreateSessionChecklistItems, useUpdateSessionChecklistItem } from '../../../hooks';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react';

const CHECKLIST_ITEMS = [
  'Shredder Cleanliness',
  'Magnet Trap',
  'Filling Station',
  'Dryer Condition',
  'Bench Scale',
  'Press Machine',
  'Metal Detector',
  'Work Area',
  'Work Tools',
  'Supporting Supplies'
];

export default function PreProductionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessionId || '');
  const [activePhase, setActivePhase] = useState<'initial' | 'final'>('initial');
  const [items, setItems] = useState<Record<string, { initial_condition?: 'OK' | 'NG'; final_condition?: 'OK' | 'NG'; initial_remarks?: string; final_remarks?: string }>>({});

  const { data: allSessions } = useProductionSessions({ status: 'ACTIVE' });
  const { data: session } = useProductionSession(selectedSessionId || '');
  const { data: checklistItems, isLoading: itemsLoading } = useSessionChecklistItems(selectedSessionId || '');
  const createItems = useCreateSessionChecklistItems();
  const updateItem = useUpdateSessionChecklistItem();

  // Initialize checklist items when session is selected
  useEffect(() => {
    if (selectedSessionId && checklistItems && checklistItems.length === 0) {
      const newItems = CHECKLIST_ITEMS.map((name, index) => ({
        production_session_id: selectedSessionId,
        item_name: name,
        sort_order: index
      }));
      createItems.mutate(newItems);
    }
  }, [selectedSessionId, checklistItems]);

  // Update local state when items are loaded
  useEffect(() => {
    if (checklistItems) {
      const state: Record<string, any> = {};
      checklistItems.forEach(item => {
        state[item.id] = {
          initial_condition: item.initial_condition,
          final_condition: item.final_condition,
          initial_remarks: item.initial_remarks || '',
          final_remarks: item.final_remarks || ''
        };
      });
      setItems(state);
    }
  }, [checklistItems]);

  const handleConditionChange = (itemId: string, condition: 'OK' | 'NG') => {
    setItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [activePhase === 'initial' ? 'initial_condition' : 'final_condition']: condition
      }
    }));
  };

  const handleRemarksChange = (itemId: string, remarks: string) => {
    setItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [activePhase === 'initial' ? 'initial_remarks' : 'final_remarks']: remarks
      }
    }));
  };

  const handleSaveItem = async (itemId: string) => {
    const data = items[itemId];
    if (!data) return;

    const updateData: Record<string, any> = {};
    if (activePhase === 'initial') {
      updateData.initial_condition = data.initial_condition;
      updateData.initial_remarks = data.initial_remarks;
    } else {
      updateData.final_condition = data.final_condition;
      updateData.final_remarks = data.final_remarks;
    }

    await updateItem.mutateAsync({ id: itemId, data: updateData });
  };

  const renderSessionSelector = () => (
    <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Production Session</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allSessions?.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedSessionId(s.id)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedSessionId === s.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <p className="font-medium text-gray-900">{s.session_number}</p>
            <p className="text-sm text-gray-500">{s.session_date} - {s.shift || '-'} - {s.line || '-'}</p>
            <p className="text-sm text-gray-500">Batch: {s.batch || '-'}</p>
          </button>
        ))}
      </div>
      {allSessions?.length === 0 && (
        <p className="text-gray-500 text-center py-4">No active sessions available. Create a session first.</p>
      )}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/daily-instructions" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pre-Production Checklist</h1>
            <p className="text-gray-500 text-sm">{session?.session_number || 'Select a session'}</p>
          </div>
        </div>
      </div>

      {/* Session Selector */}
      {!sessionId && renderSessionSelector()}

      {selectedSessionId && (
        <>
          {/* Phase Tabs */}
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setActivePhase('initial')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activePhase === 'initial'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Initial Condition (Before Production)
            </button>
            <button
              onClick={() => setActivePhase('final')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activePhase === 'final'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Final Condition (After Production)
            </button>
          </div>

          {/* Checklist Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">
                {activePhase === 'initial' ? 'Initial Conditions' : 'Final Conditions'}
              </h3>
              <p className="text-xs text-gray-500">
                {activePhase === 'initial'
                  ? 'Fill in before the production session begins'
                  : 'Fill in after the production session ends'}
              </p>
            </div>
            {itemsLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Condition</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checklistItems?.map((item) => {
                    const currentCondition = activePhase === 'initial'
                      ? items[item.id]?.initial_condition
                      : items[item.id]?.final_condition;
                    const currentRemarks = activePhase === 'initial'
                      ? items[item.id]?.initial_remarks
                      : items[item.id]?.final_remarks;
                    const isNG = currentCondition === 'NG';
                    const needsRemarks = isNG && (!currentRemarks || currentRemarks.trim() === '');

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleConditionChange(item.id, 'OK')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                currentCondition === 'OK'
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              OK
                            </button>
                            <button
                              onClick={() => handleConditionChange(item.id, 'NG')}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                currentCondition === 'NG'
                                  ? 'bg-red-100 text-red-700 border border-red-300'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              <AlertCircle className="w-4 h-4" />
                              NG
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={currentRemarks || ''}
                            onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                            placeholder={isNG ? 'Required for NG' : 'Optional'}
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${
                              needsRemarks
                                ? 'border-red-300 bg-red-50'
                                : 'border-gray-300'
                            }`}
                          />
                          {needsRemarks && (
                            <p className="text-xs text-red-500 mt-1">Remarks required when condition is NG</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleSaveItem(item.id)}
                            disabled={needsRemarks}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
