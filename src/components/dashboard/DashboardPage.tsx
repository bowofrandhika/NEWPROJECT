import { Link } from 'react-router-dom';
import { useProductionSessions, useWorkOrders, useOEESummary } from '../../hooks';
import {
  ClipboardList,
  CalendarDays,
  AlertTriangle,
  Clock,
  Package,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';

export default function DashboardPage() {
  const { data: sessions } = useProductionSessions({ status: 'ACTIVE' });
  const { data: workOrders } = useWorkOrders({ status: 'ACTIVE' });
  const { data: oeeSummary } = useOEESummary();

  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions?.filter(s => s.session_date === today) || [];

  const stats = [
    {
      name: 'Active Work Orders',
      value: workOrders?.length || 0,
      icon: ClipboardList,
      color: 'bg-blue-500',
      href: '/work-orders'
    },
    {
      name: "Today's Sessions",
      value: todaySessions.length,
      icon: CalendarDays,
      color: 'bg-green-500',
      href: '/daily-instructions'
    },
    {
      name: 'Pending Issues',
      value: 0,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      href: '/bottleneck'
    },
    {
      name: 'Avg. OEE',
      value: `${oeeSummary?.avgOEE || 0}%`,
      icon: BarChart3,
      color: 'bg-purple-500',
      href: '/oee'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Production Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Overview of today&apos;s production status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            to={stat.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* OEE Metrics */}
      {oeeSummary && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">OEE Performance</h2>
          <div className="grid grid-cols-4 gap-6">
            <OEECard
              name="Availability"
              value={oeeSummary.avgAvailability}
              target={85}
              icon={Clock}
            />
            <OEECard
              name="Performance"
              value={oeeSummary.avgPerformance}
              target={90}
              icon={TrendingUp}
            />
            <OEECard
              name="Quality"
              value={oeeSummary.avgQuality}
              target={95}
              icon={Package}
            />
            <OEECard
              name="OEE"
              value={oeeSummary.avgOEE}
              target={77}
              icon={Activity}
              highlight
            />
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Production Sessions</h2>
            <Link
              to="/daily-instructions"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {todaySessions.length > 0 ? (
            todaySessions.map((session) => (
              <Link
                key={session.id}
                to={`/daily-instructions/${session.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{session.session_number}</p>
                    <p className="text-sm text-gray-500">{session.batch}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {session.status}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No active sessions for today
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OEECard({
  name,
  value,
  target,
  icon: Icon,
  highlight
}: {
  name: string;
  value: number;
  target: number;
  icon: React.ElementType;
  highlight?: boolean;
}) {
  const isAboveTarget = value >= target;

  return (
    <div className={`p-4 rounded-lg ${highlight ? 'bg-blue-50' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-600">{name}</span>
        {isAboveTarget ? (
          <TrendingUp className="w-4 h-4 text-green-500" />
        ) : (
          <TrendingDown className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="flex items-end justify-between">
        <span className={`text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-gray-900'}`}>
          {value.toFixed(1)}%
        </span>
        <div className="flex items-center text-xs text-gray-500">
          <Icon className="w-3 h-3 mr-1" />
          Target: {target}%
        </div>
      </div>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isAboveTarget ? 'bg-green-500' : 'bg-yellow-500'}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
