import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Download, ChevronRight, User, Phone, Mail, Layers } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import { statsService } from '../services/stats.service';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await statsService.exportCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expense-tracker-export.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out');
  };

  const menuItems = [
    {
      icon: theme === 'dark' ? Sun : Moon,
      label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
      action: toggleTheme,
      trailing: (
        <div className={`w-11 h-6 rounded-full flex items-center px-0.5 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-border'}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      ),
    },
    {
      icon: Layers,
      label: 'Manage Categories',
      action: () => navigate('/categories'),
      trailing: <ChevronRight className="w-4 h-4 text-text-muted" />,
    },
    {
      icon: Download,
      label: 'Export Data (CSV)',
      action: handleExport,
      loading: exporting,
      trailing: <ChevronRight className="w-4 h-4 text-text-muted" />,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold text-text">Profile</h1>
      </div>

      {/* User Card */}
      <div className="px-5 pb-6">
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-dark">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-text">{user?.name || 'User'}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3 h-3 text-text-muted" />
                <span className="text-xs text-text-secondary">{user?.phone}</span>
              </div>
              {user?.email && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3 h-3 text-text-muted" />
                  <span className="text-xs text-text-secondary">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Menu Items */}
      <div className="px-5 pb-6">
        <Card className="divide-y divide-border">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              disabled={item.loading}
              className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-surface-alt transition-colors first:rounded-t-2xl last:rounded-b-2xl"
            >
              <item.icon className="w-5 h-5 text-text-secondary flex-shrink-0" />
              <span className="flex-1 text-sm font-medium text-text">{item.label}</span>
              {item.trailing}
            </button>
          ))}
        </Card>
      </div>

      {/* Quick Links */}
      <div className="px-5 pb-6">
        <Card className="divide-y divide-border">
          <button
            onClick={() => navigate('/income')}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-surface-alt transition-colors rounded-t-2xl"
          >
            <span className="text-sm font-medium text-text flex-1">Income Management</span>
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </button>
          <button
            onClick={() => navigate('/expenses')}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-surface-alt transition-colors rounded-b-2xl"
          >
            <span className="text-sm font-medium text-text flex-1">Expense History</span>
            <ChevronRight className="w-4 h-4 text-text-muted" />
          </button>
        </Card>
      </div>

      {/* Logout */}
      <div className="px-5 pb-8">
        <Button variant="danger" size="full" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
