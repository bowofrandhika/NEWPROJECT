import { useOEESummary } from '../../../hooks';
import { BarChart3, TrendingUp, Clock, Package, Gauge } from 'lucide-react';

export default function OEEDashboardPage() {
  const { data: oeeSummary, isLoading } = useOEESummary();

  const metrics = [
    {
      name: 'Availability',
      value: oeeSummary?.avgAvailability || 0,
      target: 85,
      description: 'Percentage of planned production time that is actually productive',
      icon: Clock,
      color: 'bg-blue-500'
    },
    {
      name: 'Performance',
      value: oeeSummary?.avgPerformance || 0,
      target: 90,
      description: 'Actual output as a percentage of ideal output',
      icon: TrendingUp,
      color: 'bg-green-500'
    },
    {
      name: 'Quality',
      value: oeeSummary?.avgQuality || 0,
      target: 95,
      description: 'Percentage of good parts produced vs total parts',
      icon: Package,
      color: 'bg-purple-500'
    },
    {
      name: 'OEE',
      value: oeeSummary?.avgOEE || 0,
      target: 77,
      description: 'Overall Equipment Effectiveness',
      icon: Gauge,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">OEE Dashboard</h1>
        <p className="text-gray-500 text-sm">Overall Equipment Effectiveness Monitoring</p>
      </div>

      {/* OEE Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <OEECard key={metric.name} {...metric} />
        ))}
      </div>

      {/* Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">OEE Trend</h2>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">OEE trend chart</p>
            <p className="text-sm text-gray-400">Data will appear as production sessions are completed</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Sessions Analyzed</h3>
          <p className="text-3xl font-bold text-gray-900">{oeeSummary?.count || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Target OEE</h3>
          <p className="text-3xl font-bold text-gray-900">77%</p>
        </div>
        <div className={`rounded-lg shadow-sm border border-gray-200 p-6 ${
          (oeeSummary?.avgOEE || 0) >= 77 ? 'bg-green-50' : 'bg-yellow-50'
        }`}>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <p className={`text-xl font-bold ${
            (oeeSummary?.avgOEE || 0) >= 77 ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {(oeeSummary?.avgOEE || 0) >= 77 ? 'On Target' : 'Below Target'}
          </p>
        </div>
      </div>
    </div>
  );
}

function OEECard({ name, value, target, description, icon: Icon, color }: {
  name: string;
  value: number;
  target: number;
  description: string;
  icon: React.ElementType;
  color: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  const isAboveTarget = value >= target;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <span className={`text-2xl font-bold ${isAboveTarget ? 'text-green-600' : 'text-gray-900'}`}>
          {value.toFixed(1)}%
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Target: {target}%</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              isAboveTarget ? 'bg-green-500' : 'bg-yellow-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
