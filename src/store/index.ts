import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './hooks/useAuth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1
    }
  }
});

// Protected Route wrapper
function ProtectedRoute() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Create router
const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPages.LoginPage />
  },
  {
    path: '/reset-password',
    element: <LoginPages.ResetPasswordPage />
  },
  {
    path: '/update-password',
    element: <LoginPages.UpdatePasswordPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Layout.MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <Dashboard.DashboardPage /> },

          // Work Orders
          { path: 'work-orders', element: <WorkOrder.WorkOrderListPage /> },
          { path: 'work-orders/:id', element: <WorkOrder.WorkOrderDetailPage /> },
          { path: 'work-orders/new', element: <WorkOrder.WorkOrderFormPage /> },

          // Production Sessions (Daily Instructions)
          { path: 'daily-instructions', element: <DailyInstruction.DailyInstructionListPage /> },
          { path: 'daily-instructions/:id', element: <DailyInstruction.DailyInstructionDetailPage /> },
          { path: 'daily-instructions/new', element: <DailyInstruction.DailyInstructionFormPage /> },

          // Module A - Pre Production
          { path: 'pre-production/:sessionId', element: <ModuleA.PreProductionPage /> },

          // Module B - Production Process
          { path: 'production/:sessionId', element: <ModuleB.ProductionProcessPage /> },

          // Module C - Dryer Monitoring
          { path: 'dryer/:sessionId', element: <ModuleC.DryerMonitoringPage /> },

          // Module D - Packing
          { path: 'packing/:sessionId', element: <ModuleD.PackingPage /> },

          // Module E - Bottleneck
          { path: 'bottleneck/:sessionId', element: <ModuleE.BottleneckPage /> },

          // Module F - Downtime
          { path: 'downtime/:sessionId', element: <ModuleF.DowntimePage /> },

          // Reports
          { path: 'reports', element: <Reports.ReportsPage /> },

          // OEE Dashboard
          { path: 'oee', element: <OEE.OEEDashboardPage /> },

          // Traceability
          { path: 'traceability', element: <Traceability.TraceabilityPage /> },

          // Maintenance
          { path: 'maintenance', element: <Maintenance.MaintenancePage /> },

          // Quality
          { path: 'quality', element: <Quality.QualityPage /> },

          // Admin
          { path: 'admin/users', element: <UserManagement.UserListPage /> },
          { path: 'admin/master', element: <MasterData.MasterDataPage /> },
          { path: 'admin/audit', element: <Audit.AuditLogPage /> }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
