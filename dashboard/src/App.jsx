import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import useAuthStore from './store/useAuthStore.js';
import useAdminStore from './store/useAdminStore.js';
import { adminService } from './services/admin.service.js';
import AdminLayout from './components/layout/AdminLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OverviewPage from './pages/OverviewPage.jsx';
import AccountsPage from './pages/AccountsPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import IncomePage from './pages/IncomePage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import AddTransactionPage from './pages/AddTransactionPage.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading admin panel…</span>
        </div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

// Fetches all accounts once and keeps them in the admin store
function AccountsLoader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAccounts = useAdminStore((s) => s.setAccounts);

  useEffect(() => {
    if (!isAuthenticated) return;
    adminService.listUsers()
      .then((res) => setAccounts(res.users || []))
      .catch(() => toast.error('Failed to load accounts'));
  }, [isAuthenticated]);

  return null;
}

import { ConfigProvider } from 'antd';

export default function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, []);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#5b72ee',
          borderRadius: 12,
          fontFamily: 'inherit',
          colorBorder: '#f1f5f9',
          colorTextHeading: '#0f172a',
        },
      }}
    >
      <AccountsLoader />
      <Routes>
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />

        <Route path="/*" element={
          <ProtectedRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<OverviewPage />} />
                <Route path="/transactions" element={<AddTransactionPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/accounts/:userId" element={<AccountPage />} />
                <Route path="/accounts/:userId/expenses" element={<ExpensesPage />} />
                <Route path="/accounts/:userId/income" element={<IncomePage />} />
                <Route path="/accounts/:userId/transactions" element={<TransactionsPage />} />
                <Route path="/accounts/:userId/stats" element={<StatsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AdminLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </ConfigProvider>
  );
}
