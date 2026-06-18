import { useParams, Link } from 'react-router-dom';
import { useProductionSession, usePalletTrackings, useCreatePalletTracking, useVerifyPallet } from '../../../hooks';
import { useState } from 'react';
import { ArrowLeft, Plus, Package, QrCode } from 'lucide-react';
import { formatDate, getStatusColor } from '../../../lib/utils';

export default function PackingPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session } = useProductionSession(sessionId!);
  const { data: pallets } = usePalletTrackings(sessionId!);
  const createPallet = useCreatePalletTracking();
  const verifyPallet = useVerifyPallet();

  const [showForm, setShowForm] = useState(false);

  const totalQty = pallets?.reduce((sum, p) => sum + p.packed_qty, 0) || 0;
  const totalBags = pallets?.reduce((sum, p) => sum + (p.number_of_bags || 0), 0) || 0;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to={`/daily-instructions/${sessionId}`} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Module D - Packing & Pallet</h1>
            <p className="text-gray-500 text-sm">{session?.session_number || 'Loading...'}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Pallet
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Total Pallets" value={pallets?.length || 0} icon={Package} />
        <SummaryCard label="Total Quantity" value={totalQty} icon={Package} />
        <SummaryCard label="Total Bags" value={totalBags} icon={Package} />
      </div>

      {/* Pallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pallets && pallets.length > 0 ? (
          pallets.map((pallet) => (
            <div
              key={pallet.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">{pallet.pallet_code}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pallet.status)}`}>
                  {pallet.status}
                </span>
              </div>
              <div className="space-y-1 text-sm text-gray-500 mb-3">
                <p>Date: {formatDate(pallet.packing_date)}</p>
                <p>Quantity: {pallet.packed_qty}</p>
                <p>Bags: {pallet.number_of_bags || 0}</p>
              </div>
              {pallet.status === 'PACKED' && (
                <button
                  onClick={() => verifyPallet.mutateAsync(pallet.id)}
                  className="w-full py-2 text-sm text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                >
                  Verify
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No pallets created yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
