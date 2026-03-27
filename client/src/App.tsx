import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoadingScreen } from './components/ui/Spinner';
import { Dashboard } from './pages/Dashboard';
import { AuthPage } from './pages/AuthPage';

const TenantsPage = lazy(() => import('./pages/TenantsPage'));
const CampaignTypesPage = lazy(() => import('./pages/CampaignTypesPage'));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage'));
const AccessRequestsPage = lazy(() =>
  import('./pages/AccessRequestsPage').then((m) => ({ default: m.AccessRequestsPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Redirects to /login when not authenticated
const ProtectedRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/login" element={<AuthPage />} />

    <Route element={<ProtectedRoutes />}>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route
          path="/tenants"
          element={<Suspense fallback={<LoadingScreen />}><TenantsPage /></Suspense>}
        />
        <Route
          path="/campaign-types"
          element={<Suspense fallback={<LoadingScreen />}><CampaignTypesPage /></Suspense>}
        />
        <Route
          path="/campaigns"
          element={<Suspense fallback={<LoadingScreen />}><CampaignsPage /></Suspense>}
        />
        <Route
          path="/access-requests"
          element={<Suspense fallback={<LoadingScreen />}><AccessRequestsPage /></Suspense>}
        />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: { fontSize: '14px', borderRadius: '10px' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
