import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  Settings,
  Users,
  BarChart3,
  Wrench,
  ShieldCheck,
  PackageSearch,
  Gauge,
  AlertTriangle,
  Clock,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Factory,
  Package,
  FileText
} from 'lucide-react';

interface NavItem {
  name: string;
  path?: string;
  icon: ReactNode;
  roles?: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Work Orders', path: '/work-orders', icon: <ClipboardList className="w-5 h-5" />, roles: ['ADMIN', 'SPV'] },
  { name: 'Daily Instructions', path: '/daily-instructions', icon: <CalendarDays className="w-5 h-5" /> },
  {
    name: 'Production',
    icon: <Factory className="w-5 h-5" />,
    children: [
      { name: 'Pre-Production', icon: <Settings className="w-4 h-4" /> },
      { name: 'Production Process', icon: <Package className="w-4 h-4" /> },
      { name: 'Dryer Monitoring', icon: <Gauge className="w-4 h-4" /> },
      { name: 'Packing', icon: <Package className="w-4 h-4" /> }
    ]
  },
  {
    name: 'Issues',
    icon: <AlertTriangle className="w-5 h-5" />,
    children: [
      { name: 'Bottleneck', icon: <AlertTriangle className="w-4 h-4" /> },
      { name: 'Downtime', icon: <Clock className="w-4 h-4" /> }
    ]
  },
  { name: 'OEE Dashboard', path: '/oee', icon: <BarChart3 className="w-5 h-5" /> },
  { name: 'Traceability', path: '/traceability', icon: <PackageSearch className="w-5 h-5" /> },
  { name: 'Maintenance', path: '/maintenance', icon: <Wrench className="w-5 h-5" /> },
  { name: 'Quality', path: '/quality', icon: <ShieldCheck className="w-5 h-5" /> },
  { name: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" /> },
  { name: 'User Management', path: '/admin/users', icon: <Users className="w-5 h-5" />, roles: ['ADMIN', 'SPV'] }
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { appUser, logout, hasRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.some(role => hasRole(role));
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Factory className="w-8 h-8 text-blue-600" />
            {sidebarOpen && (
              <span className="text-lg font-semibold text-gray-900">PMS</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-500" />
            ) : (
              <Menu className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => (
              <li key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => setExpandedMenu(expandedMenu === item.name ? null : item.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        {item.icon}
                        {sidebarOpen && <span>{item.name}</span>}
                      </div>
                      {sidebarOpen && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            expandedMenu === item.name ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>
                    {expandedMenu === item.name && sidebarOpen && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <li key={child.name}>
                            <Link
                              to={`/${child.name.toLowerCase().replace(' ', '-')}`}
                              className="flex items-center space-x-2 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100"
                            >
                              {child.icon}
                              <span>{child.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.path!}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    {sidebarOpen && <span>{item.name}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {appUser?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {appUser?.full_name}
                </p>
                <p className="text-xs text-gray-500">{appUser?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-600 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-5 h-5" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
