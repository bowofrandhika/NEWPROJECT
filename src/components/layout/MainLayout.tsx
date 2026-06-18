import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth, useUnreadWONotifications } from '../../hooks';
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
  FileText,
  Bell,
  Shield
} from 'lucide-react';

interface NavItem {
  name: string;
  path?: string;
  icon: ReactNode;
  access?: string[];
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { name: 'Work Orders', path: '/work-orders', icon: <ClipboardList className="w-5 h-5" />, access: ['production', 'issues', 'reports'] },
  { name: 'Daily Instructions', path: '/daily-instructions', icon: <CalendarDays className="w-5 h-5" />, access: ['production'] },
  {
    name: 'Production',
    icon: <Factory className="w-5 h-5" />,
    access: ['production'],
    children: [
      { name: 'Pre-Production', path: '/daily-instructions', icon: <Settings className="w-4 h-4" />, access: ['production'] },
      { name: 'Production Log', path: '/daily-instructions', icon: <Package className="w-4 h-4" />, access: ['production'] },
      { name: 'Dryer Monitoring', path: '/daily-instructions', icon: <Gauge className="w-4 h-4" />, access: ['production'] },
      { name: 'Packing', path: '/daily-instructions', icon: <Package className="w-4 h-4" />, access: ['production'] }
    ]
  },
  {
    name: 'Issues',
    icon: <AlertTriangle className="w-5 h-5" />,
    access: ['issues'],
    children: [
      { name: 'Bottleneck', path: '/daily-instructions', icon: <AlertTriangle className="w-4 h-4" />, access: ['issues'] },
      { name: 'Downtime', path: '/daily-instructions', icon: <Clock className="w-4 h-4" />, access: ['issues'] }
    ]
  },
  { name: 'OEE Dashboard', path: '/oee', icon: <BarChart3 className="w-5 h-5" />, access: ['reports'] },
  { name: 'Traceability', path: '/traceability', icon: <PackageSearch className="w-5 h-5" />, access: ['production'] },
  { name: 'Maintenance', path: '/maintenance', icon: <Wrench className="w-5 h-5" />, access: ['production'] },
  { name: 'Quality', path: '/quality', icon: <ShieldCheck className="w-5 h-5" />, access: ['production'] },
  { name: 'Reports', path: '/reports', icon: <FileText className="w-5 h-5" />, access: ['reports'] },
  { name: 'User Management', path: '/admin/users', icon: <Users className="w-5 h-5" />, access: ['users'] },
  { name: 'Master Data', path: '/admin/master', icon: <Settings className="w-5 h-5" />, access: ['master_data'] }
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { appUser, logout, isSuperUser, canAccess } = useAuth();
  const { data: unreadNotifications } = useUnreadWONotifications();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavItems = navItems.filter(item => {
    if (isSuperUser()) return true;
    if (!item.access) return true;
    return item.access.some(access => canAccess(access));
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <Factory className="w-8 h-8 text-blue-400" />
            {sidebarOpen && (
              <span className="text-lg font-semibold text-white">PBS</span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded-lg hover:bg-slate-800"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-slate-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-400" />
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
                      className="w-full flex items-center justify-between px-3 py-2 text-slate-300 rounded-lg hover:bg-slate-800"
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
                              to={child.path || `/${child.name.toLowerCase().replace(' ', '-')}`}
                              className="flex items-center space-x-2 px-3 py-2 text-slate-400 rounded-lg hover:bg-slate-800"
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
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
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
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            {appUser?.photo_url ? (
              <img
                src={appUser.photo_url}
                alt={appUser.full_name}
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-medium">
                  {appUser?.full_name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {appUser?.full_name}
                </p>
                <div className="flex items-center gap-1">
                  {appUser?.role === 'SUPER_USER' && <Shield className="w-3 h-3 text-red-400" />}
                  <p className="text-xs text-slate-400">{appUser?.role}</p>
                </div>
              </div>
            )}
          </div>
          {/* Notifications for super user */}
          {isSuperUser() && unreadNotifications && unreadNotifications.length > 0 && sidebarOpen && (
            <div className="mt-3 p-2 bg-red-900/50 rounded-lg border border-red-800/50">
              <div className="flex items-center gap-2">
                <Bell className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-300">{unreadNotifications.length} WO notifications</span>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 text-red-400 rounded-lg hover:bg-slate-800"
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
