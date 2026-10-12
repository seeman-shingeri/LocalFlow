import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Loader2 } from 'lucide-react';

const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('@/pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })));
const ResetPasswordPage = lazy(() =>
  import('@/pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage }))
);
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const CustomersPage = lazy(() => import('@/pages/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const EnquiriesPage = lazy(() => import('@/pages/EnquiriesPage').then((m) => ({ default: m.EnquiriesPage })));
const FollowUpsPage = lazy(() => import('@/pages/FollowUpsPage').then((m) => ({ default: m.FollowUpsPage })));
const AppointmentsPage = lazy(() =>
  import('@/pages/AppointmentsPage').then((m) => ({ default: m.AppointmentsPage }))
);
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage').then((m) => ({ default: m.InvoicesPage })));
const AIAssistantPage = lazy(() =>
  import('@/pages/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage }))
);
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

const PageLoader: React.FC = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      <p className="text-xs font-medium text-slate-500">Loading view...</p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-xs font-medium text-slate-500">Loading LocalFlow AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Protected App Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="enquiries" element={<EnquiriesPage />} />
                <Route path="follow-ups" element={<FollowUpsPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="invoices" element={<InvoicesPage />} />
                <Route path="ai-assistant" element={<AIAssistantPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
