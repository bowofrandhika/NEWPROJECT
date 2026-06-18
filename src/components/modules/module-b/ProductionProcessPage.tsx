import { useParams, Link } from 'react-router-dom';
import { useProductionSession, useProductionLogDetails, useUpsertProductionLogDetails, useForemen } from '../../../hooks';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Package, Fuel, Droplets, FileText } from 'lucide-react';

const TAB_NAMES = [
  { id: 'session', label: 'Session', icon: FileText },
  { id: 'material', label: 'Material', icon: Package },
  { id: 'process', label: 'Process Flow', icon: Droplets },
  { id: 'fuel', label: 'Fuel', icon: Fuel }
] as const;

const VISUAL_CONDITIONS = ['Clean', 'Moderate', 'Dirty'] as const;

export default function ProductionProcessPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session } = useProductionSession(sessionId!);
  const { data: details } = useProductionLogDetails(sessionId!);
  const { data: foremen } = useForemen();
  const upsertDetails = useUpsertProductionLogDetails();
  const [activeTab, setActiveTab] = useState<string>('session');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (details) {
      setFormData({
        foreman_id: details.foreman_id || '',
        production_start_time: details.production_start_time ? new Date(details.production_start_time).toISOString().slice(0, 16) : '',
        production_end_time: details.production_end_time ? new Date(details.production_end_time).toISOString().slice(0, 16) : '',
        material_room: details.material_room || '',
        material_deck: details.material_deck || '',
        material_update_date: details.material_update_date || '',
        material_drying_time_days: details.material_drying_time_days || '',
        material_visual_condition: details.material_visual_condition || '',
        material_line_cleaning: details.material_line_cleaning || '',
        material_remarks: details.material_remarks || '',
        avg_cake_weight: details.avg_cake_weight || '',
        variation: details.variation || '',
        process_remarks: details.process_remarks || '',
        bale_count: details.bale_count || 0,
        pallet_count: details.pallet_count || 0,
        total_weight_kg: details.total_weight_kg || 0,
        diesel_start_l: details.diesel_start_l || '',
        diesel_end_l: details.diesel_end_l || '',
        diesel_consumption_l: details.diesel_consumption_l || '',
        pks_consumption_kg: details.pks_consumption_kg || ''
      });
    }
  }, [details]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Auto-calculate diesel consumption
      if (field === 'diesel_start_l' || field === 'diesel_end_l') {
        const start = parseFloat(updated.diesel_start_l) || 0;
        const end = parseFloat(updated.diesel_end_l) || 0;
        if (end > start) {
          updated.diesel_consumption_l = end - start;
        }
      }
      // Auto-calculate drying time
      if (field === 'material_update_date' && updated.material_update_date) {
        const updateDate = new Date(updated.material_update_date);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - updateDate.getTime());
        updated.material_drying_time_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
      // Auto-calculate total weight
      if (field === 'bale_count' || field === 'pallet_count') {
        const bales = parseInt(updated.bale_count) || 0;
        const pallets = parseInt(updated.pallet_count) || 0;
        const totalBales = bales + (pallets * 36);
        updated.total_weight_kg = totalBales * 35;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await upsertDetails.mutateAsync({
        sessionId: sessionId!,
        data: {
          ...formData,
          bale_count: parseInt(formData.bale_count) || 0,
          pallet_count: parseInt(formData.pallet_count) || 0,
          total_weight_kg: parseFloat(formData.total_weight_kg) || 0
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/daily-instructions/${sessionId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Production Log</h1>
            <p className="text-gray-500 text-sm">{session?.session_number || 'Loading...'}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Session:</span>
            <span className="ml-2 font-medium">{session?.session_number}</span>
          </div>
          <div>
            <span className="text-gray-500">Batch:</span>
            <span className="ml-2 font-medium">{session?.batch || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Buyer:</span>
            <span className="ml-2 font-medium">{session?.buyer_id || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Packaging:</span>
            <span className="ml-2 font-medium">{session?.packaging || '-'}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        {TAB_NAMES.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Tab 1: Session */}
        {activeTab === 'session' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Session</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foreman</label>
                <select
                  value={formData.foreman_id || ''}
                  onChange={(e) => handleChange('foreman_id', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Foreman</option>
                  {foremen?.map((f) => (
                    <option key={f.id} value={f.id}>{f.full_name}</option>
                  ))}
                </select>
              </div>
              <div></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production Start Time</label>
                <input
                  type="datetime-local"
                  value={formData.production_start_time || ''}
                  onChange={(e) => handleChange('production_start_time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Production End Time</label>
                <input
                  type="datetime-local"
                  value={formData.production_end_time || ''}
                  onChange={(e) => handleChange('production_end_time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Material */}
        {activeTab === 'material' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Material Identification</h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                <input
                  value={session?.batch || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer</label>
                <input
                  value={session?.buyer_id || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  value={formData.material_room || ''}
                  onChange={(e) => handleChange('material_room', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter room"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deck</label>
                <input
                  value={formData.material_deck || ''}
                  onChange={(e) => handleChange('material_deck', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter deck"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Update Date</label>
                <input
                  type="date"
                  value={formData.material_update_date || ''}
                  onChange={(e) => handleChange('material_update_date', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drying Time (Days)</label>
                <input
                  type="number"
                  value={formData.material_drying_time_days || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visual Condition</label>
                <select
                  value={formData.material_visual_condition || ''}
                  onChange={(e) => handleChange('material_visual_condition', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {VISUAL_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Line Cleaning</label>
                <select
                  value={formData.material_line_cleaning || ''}
                  onChange={(e) => handleChange('material_line_cleaning', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select</option>
                  {VISUAL_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={formData.material_remarks || ''}
                onChange={(e) => handleChange('material_remarks', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Add remarks..."
              />
            </div>
          </div>
        )}

        {/* Tab 3: Process Flow */}
        {activeTab === 'process' && (
          <div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Press & Weighing</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avg. Cake Weight (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.avg_cake_weight || ''}
                    onChange={(e) => handleChange('avg_cake_weight', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter weight"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Variation</label>
                  <input
                    value={formData.variation || ''}
                    onChange={(e) => handleChange('variation', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter variation"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={formData.process_remarks || ''}
                  onChange={(e) => handleChange('process_remarks', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add remarks..."
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Product</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bale</label>
                  <input
                    type="number"
                    value={formData.bale_count || ''}
                    onChange={(e) => handleChange('bale_count', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Number of bales"
                  />
                  <p className="text-xs text-gray-500 mt-1">1 bale = 35 kg</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pallet</label>
                  <input
                    type="number"
                    value={formData.pallet_count || ''}
                    onChange={(e) => handleChange('pallet_count', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Number of pallets"
                  />
                  <p className="text-xs text-gray-500 mt-1">1 pallet = 36 bales</p>
                </div>
                <div className="col-span-2">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-500">Total Weight (Auto Calculate)</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formData.total_weight_kg?.toLocaleString() || 0} KG
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(() => {
                        const bales = parseInt(formData.bale_count) || 0;
                        const pallets = parseInt(formData.pallet_count) || 0;
                        const totalBales = bales + (pallets * 36);
                        return `${totalBales} bales total (1 bale = 35kg, 1 pallet = 36 bales, 1 lot = 8 pallets)`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Fuel */}
        {activeTab === 'fuel' && (
          <div>
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Diesel</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diesel Start (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.diesel_start_l || ''}
                    onChange={(e) => handleChange('diesel_start_l', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Start level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diesel End (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.diesel_end_l || ''}
                    onChange={(e) => handleChange('diesel_end_l', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="End level"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consumption (L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.diesel_consumption_l || ''}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                    placeholder="Auto calculated"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Palm Kernel Shell (PKS)</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consumption (KG)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.pks_consumption_kg || ''}
                    onChange={(e) => handleChange('pks_consumption_kg', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter PKS consumption"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
