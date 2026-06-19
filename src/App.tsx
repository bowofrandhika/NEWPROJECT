import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from './hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1
    }
  }
});

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
import * as Admin from './components/modules/admin';

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
          <Route path="work-orders" element={<WorkOrder.WorkOrderListPage />} />
          <Route path="work-orders/:id" element={<WorkOrder.WorkOrderDetailPage />} />
          <Route path="work-orders/new" element={<WorkOrder.WorkOrderFormPage />} />
          <Route path="daily-instructions" element={<DailyInstruction.DailyInstructionListPage />} />
          <Route path="daily-instructions/:id" element={<DailyInstruction.DailyInstructionDetailPage />} />
          <Route path="daily-instructions/new" element={<DailyInstruction.DailyInstructionFormPage />} />
          <Route path="pre-production/:sessionId" element={<ModuleA.PreProductionPage />} />
          <Route path="production/:sessionId" element={<ModuleB.ProductionProcessPage />} />
          <Route path="dryer/:sessionId" element={<ModuleC.DryerMonitoringPage />} />
          <Route path="packing/:sessionId" element={<ModuleD.PackingPage />} />
          <Route path="bottleneck/:sessionId" element={<ModuleE.BottleneckPage />} />
          <Route path="downtime/:sessionId" element={<ModuleF.DowntimePage />} />
          <Route path="reports" element={<Reports.ReportsPage />} />
          <Route path="oee" element={<OEE.OEEDashboardPage />} />
          <Route path="traceability" element={<Traceability.TraceabilityPage />} />
          <Route path="maintenance" element={<Maintenance.MaintenancePage />} />
          <Route path="quality" element={<Quality.QualityPage />} />
          <Route path="admin/users" element={<Admin.UserListPage />} />
          <Route path="admin/master" element={<Admin.MasterDataPage />} />
          <Route path="admin/audit" element={<Admin.AuditLogPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const [initialized, setInitialized] = useState(false);
  // Use a ref so the effect only runs once regardless of checkAuth reference changes
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    checkAuth().finally(() => setInitialized(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
