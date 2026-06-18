import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProductionSessions, useDeleteProductionSession, useActivateSession, useCompleteSession } from '../../../hooks';
import { Plus, Search, Play, CheckCircle, Eye, CreditCard as Edit, Trash2 } from 'lucide-react';
import { formatDate, getStatusColor } from '../../../lib/utils';

export default function DailyInstructionListPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [dateFilter, setDateFilter] = useState<string>('');
  const { data: sessions, isLoading } = useProductionSessions({
    date: dateFilter || undefined
  });
  const deleteSession = useDeleteProductionSession();
  const activateSession = useActivateSession();
  const completeSession = useCompleteSession();

  const activeSessions = sessions?.filter(s => s.status === 'ACTIVE' || s.status === 'DRAFT');
  const completedSessions = sessions?.filter(s => s.status === 'COMPLETED' || s.status === 'CANCELLED');
  const currentSessions = activeTab === 'active' ? activeSessions : completedSessions;

  const filteredSessions = currentSessions?.filter(session =>
    search
      ? session.session_number.toLowerCase().includes(search.toLowerCase()) ||
        (session.batch && session.batch.toLowerCase().includes(search.toLowerCase()))
      : true
  );

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this production session?')) {
      await deleteSession.mutateAsync(id);
    }
  };

  const handleActivate = async (id: string) => {
    if (window.confirm('Activate this production session?')) {
      await activateSession.mutateAsync(id);
    }
  };

  const handleComplete = async (id: string) => {
    if (window.confirm('Mark this session as completed?')) {
      await completeSession.mutateAsync(id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Instructions</h1>
          <p className="text-gray-500 text-sm">Production session management</p>
        </div>
        <Link
          to="/daily-instructions/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Session
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'active' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Active ({activeSessions?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'completed' ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Completed ({completedSessions?.length || 0})
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading sessions...</p>
          </div>
        ) : filteredSessions?.length === 0 ? (
          <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            No production sessions found
          </div>
        ) : (
          filteredSessions?.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Link
                    to={`/daily-instructions/${session.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600"
                  >
                    {session.session_number}
                  </Link>
                  <p className="text-sm text-gray-500">{formatDate(session.session_date)}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Shift:</span>
                  <span className="font-medium">{session.shift || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Line:</span>
                  <span className="font-medium">{session.line || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging:</span>
                  <span className="font-medium">{session.packaging || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="font-medium">{session.production_target_kg.toLocaleString()} KG</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual:</span>
                  <span className="font-medium text-green-600">{session.actual_production_kg.toLocaleString()} KG</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${session.production_target_kg > 0 ? Math.min((session.actual_production_kg / session.production_target_kg) * 100, 100) : 0}%`
                  }}
                ></div>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-3">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/pre-production/${session.id}`}
                    className="btn-xs text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Module A
                  </Link>
                  <Link
                    to={`/production/${session.id}`}
                    className="btn-xs text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Module B
                  </Link>
                </div>
                <div className="flex items-center gap-1">
                  {session.status === 'DRAFT' && (
                    <button
                      onClick={() => handleActivate(session.id)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                      title="Activate"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  {session.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleComplete(session.id)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      title="Complete"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <Link
                    to={`/daily-instructions/${session.id}`}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/daily-instructions/${session.id}?edit=true`}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(session.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
