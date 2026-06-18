import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProductionSessions, useDeleteProductionSession, useActivateSession, useCompleteSession } from '../../../hooks';
import { Plus, Search, Filter, Play, CheckCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { formatDate, getStatusColor } from '../../../lib/utils';

export default function DailyInstructionListPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const { data: sessions, isLoading } = useProductionSessions({
    status: statusFilter || undefined,
    date: dateFilter || undefined
  });
  const deleteSession = useDeleteProductionSession();
  const activateSession = useActivateSession();
  const completeSession = useCompleteSession();

  const filteredSessions = sessions?.filter(session =>
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
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
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
                  <span>Batch:</span>
                  <span className="font-medium">{session.batch || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target:</span>
                  <span className="font-medium">{session.target_production.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actual:</span>
                  <span className="font-medium text-green-600">{session.actual_production.toLocaleString()}</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${Math.min((session.actual_production / session.target_production) * 100 || 0, 100)}%`
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
