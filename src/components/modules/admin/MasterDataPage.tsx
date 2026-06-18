import { useState } from 'react';
import { useBuyers, useCreateBuyer, useProducts, useCreateProduct, useLines, useCreateLine, useShifts, useCreateShift, useDryers, useCreateDryer, useTrolleys, useCreateTrolley } from '../../../hooks';
import { Database, Users, Package, Factory, Clock, Thermometer, ShoppingBag } from 'lucide-react';

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState('buyers');

  const { data: buyers } = useBuyers();
  const { data: products } = useProducts();
  const { data: lines } = useLines();
  const { data: shifts } = useShifts();
  const { data: dryers } = useDryers();
  const { data: trolleys } = useTrolleys();

  const tabs = [
    { id: 'buyers', name: 'Buyers', icon: Users, count: buyers?.length || 0 },
    { id: 'products', name: 'Products', icon: Package, count: products?.length || 0 },
    { id: 'lines', name: 'Lines', icon: Factory, count: lines?.length || 0 },
    { id: 'shifts', name: 'Shifts', icon: Clock, count: shifts?.length || 0 },
    { id: 'dryers', name: 'Dryers', icon: Thermometer, count: dryers?.length || 0 },
    { id: 'trolleys', name: 'Trolleys', icon: ShoppingBag, count: trolleys?.length || 0 }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Master Data</h1>
        <p className="text-gray-500 text-sm">Manage system master data</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === tab.id ? 'bg-blue-200' : 'bg-gray-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 capitalize">{activeTab}</h2>
          <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Add New
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'buyers' && (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {buyers?.map((buyer) => (
                  <tr key={buyer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{buyer.buyer_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{buyer.buyer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{buyer.contact_person || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        buyer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {buyer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'products' && (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products?.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{product.product_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{product.product_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{product.unit}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'lines' && (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lines?.map((line) => (
                  <tr key={line.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{line.line_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{line.line_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{line.line_type || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{line.capacity || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'shifts' && (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {shifts?.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{shift.shift_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{shift.shift_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{shift.shift_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{shift.start_time} - {shift.end_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'dryers' && (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp Range</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {dryers?.map((dryer) => (
                  <tr key={dryer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{dryer.dryer_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{dryer.dryer_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{dryer.capacity || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {dryer.min_temp && dryer.max_temp ? `${dryer.min_temp} - ${dryer.max_temp}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'trolleys' && (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {trolleys?.map((trolley) => (
                  <tr key={trolley.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{trolley.trolley_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{trolley.trolley_name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{trolley.capacity || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trolley.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {trolley.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
