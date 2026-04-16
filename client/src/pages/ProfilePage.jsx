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
    <div className="h-full overflow-y-auto animate-fade-in bg-bg pb-32">
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-3xl font-black text-text tracking-tight">Profile</h1>
      </div>

      {/* User Card */}
      <div className="px-5 pb-6">
        <Card className="p-6 bg-surface border-white/5 shadow-xl rounded-[32px]">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center shadow-inner">
              <span className="text-2xl font-black text-primary">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-text truncate tracking-tight">{user?.name || 'User'}</h2>
              <div className="flex items-center gap-2 mt-1 opacity-70">
                <Phone className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-xs font-bold text-text-secondary">{user?.phone}</span>
              </div>
              {user?.email && (
                <div className="flex items-center gap-2 mt-1 opacity-70">
                  <Mail className="w-3.5 h-3.5 text-text-secondary" />
                  <span className="text-xs font-bold text-text-secondary truncate">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Menu Sections */}
      <div className="px-5 space-y-6">
        <div>
          <p className="px-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">Preferences</p>
          <Card className="divide-y divide-border/10 bg-surface border-white/5 shadow-lg rounded-[28px] overflow-hidden">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                disabled={item.loading}
                className="flex items-center gap-4 w-full px-5 py-4.5 text-left active:bg-surface-alt/40 transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center transition-transform group-active:scale-90">
                  <item.icon className="w-4.5 h-4.5 text-text-secondary" />
                </div>
                <span className="flex-1 text-sm font-bold text-text tracking-tight">{item.label}</span>
                {item.trailing}
              </button>
            ))}
          </Card>
        </div>

        <div>
          <p className="px-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted opacity-40">Management</p>
          <Card className="divide-y divide-border/10 bg-surface border-white/5 shadow-lg rounded-[28px] overflow-hidden">
            <button
              onClick={() => navigate('/income')}
              className="flex items-center gap-4 w-full px-5 py-4.5 text-left active:bg-surface-alt/40 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_#22C55E]" />
              </div>
              <span className="text-sm font-bold text-text flex-1 tracking-tight">Income Management</span>
              <ChevronRight className="w-4 h-4 text-text-muted opacity-40" />
            </button>
            <button
              onClick={() => navigate('/expenses')}
              className="flex items-center gap-4 w-full px-5 py-4.5 text-left active:bg-surface-alt/40 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-surface-alt flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_#EF4444]" />
              </div>
              <span className="text-sm font-bold text-text flex-1 tracking-tight">Expense History</span>
              <ChevronRight className="w-4 h-4 text-text-muted opacity-40" />
            </button>
          </Card>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <button 
            onClick={handleLogout}
            className="w-full py-4.5 rounded-[24px] bg-danger/10 text-danger font-black text-sm tracking-widest uppercase flex items-center justify-center gap-3 active:scale-[0.98] transition-all border border-danger/20"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
