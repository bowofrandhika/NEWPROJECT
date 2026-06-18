import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from './hooks/useAuth';
import { supabase } from './lib/supabase';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1
    }
  }
});

// Import all components
import * as LoginPages from './components/auth';
import * as Layout from './components/layout';
import * as Dashboard from './components/dashboard';
import * as WorkOrder from './components/modules/work-order';
import * as DailyInstruction from './components/modules/daily-instruction';
import * as ModuleA from './components/modules/module-a';
import * as ModuleB from './components/modules/module-b';
import * as ModuleC from './components/modules/module-c';
import * as ModuleD from './components/modules/module-d';
import * as ModuleE from './components/modules/module-e';
import * as ModuleF from './components/modules/module-f';
import * as OEE from './components/modules/oee';
import * as Maintenance from './components/modules/maintenance';
import * as Quality from './components/modules/quality';
import * as Traceability from './components/modules/traceability';
import * as Reports from './components/modules/reports';
import * as UserManagement from './components/modules/admin';
import * as MasterData from './components/modules/admin';
import * as Audit from './components/modules/admin';

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPages.LoginPage />} />
      <Route path="/signup" element={<LoginPages.SignupPage />} />
      <Route path="/reset-password" element={<LoginPages.ResetPasswordPage />} />
      <Route path="/update-password" element={<LoginPages.UpdatePasswordPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout.MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard.DashboardPage />} />

          {/* Work Orders */}
          <Route path="work-orders" element={<WorkOrder.WorkOrderListPage />} />
          <Route path="work-orders/:id" element={<WorkOrder.WorkOrderDetailPage />} />
          <Route path="work-orders/new" element={<WorkOrder.WorkOrderFormPage />} />

          {/* Production Sessions (Daily Instructions) */}
          <Route path="daily-instructions" element={<DailyInstruction.DailyInstructionListPage />} />
          <Route path="daily-instructions/:id" element={<DailyInstruction.DailyInstructionDetailPage />} />
          <Route path="daily-instructions/new" element={<DailyInstruction.DailyInstructionFormPage />} />

          {/* Module A - Pre Production */}
          <Route path="pre-production/:sessionId" element={<ModuleA.PreProductionPage />} />

          {/* Module B - Production Process */}
          <Route path="production/:sessionId" element={<ModuleB.ProductionProcessPage />} />

          {/* Module C - Dryer Monitoring */}
          <Route path="dryer/:sessionId" element={<ModuleC.DryerMonitoringPage />} />

          {/* Module D - Packing */}
          <Route path="packing/:sessionId" element={<ModuleD.PackingPage />} />

          {/* Module E - Bottleneck */}
          <Route path="bottleneck/:sessionId" element={<ModuleE.BottleneckPage />} />

          {/* Module F - Downtime */}
          <Route path="downtime/:sessionId" element={<ModuleF.DowntimePage />} />

          {/* Reports */}
          <Route path="reports" element={<Reports.ReportsPage />} />

          {/* OEE Dashboard */}
          <Route path="oee" element={<OEE.OEEDashboardPage />} />

          {/* Traceability */}
          <Route path="traceability" element={<Traceability.TraceabilityPage />} />

          {/* Maintenance */}
          <Route path="maintenance" element={<Maintenance.MaintenancePage />} />

          {/* Quality */}
          <Route path="quality" element={<Quality.QualityPage />} />

          {/* Admin */}
          <Route path="admin/users" element={<UserManagement.UserListPage />} />
          <Route path="admin/master" element={<MasterData.MasterDataPage />} />
          <Route path="admin/audit" element={<Audit.AuditLogPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      setInitialized(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
