import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, LogOut, Download, ChevronRight, User, Phone, Mail, Layers } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import usePwaStore from '../store/usePwaStore';
import { statsService } from '../services/stats.service';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, toggleTheme } = useThemeStore();
  const { installPrompt, setInstallPrompt } = usePwaStore();
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

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      toast.success('Installing SpendWise...');
    }
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

  if (installPrompt) {
    menuItems.push({
      icon: Download,
      label: 'Install App',
      action: handleInstallPwa,
      trailing: <div className="px-2 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Install</div>,
    });
  }

  return (
    <div className="h-full overflow-y-auto animate-fade-in bg-bg pb-32">
      <div className="px-5 pt-4 pb-1">
        <h1 className="text-[28px] font-black text-text tracking-tight">
          Profile<span className="text-primary">.</span>
        </h1>
      </div>

      {/* User Info */}
      <div className="px-5 pt-2 pb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-2xl font-black text-primary">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[22px] font-medium text-text tracking-tight truncate">{user?.name || 'User'}</h2>
            <div className="flex items-center gap-3 mt-1 opacity-60">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-text" />
                <span className="text-xs text-text truncate">{user?.phone}</span>
              </div>
              {user?.email && (
                <>
                  <div className="w-1 h-1 rounded-full bg-text/30" />
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-text" />
                    <span className="text-xs text-text truncate">{user.email}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="px-5 space-y-10">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] uppercase tracking-wide font-bold text-text-secondary">
              Preferences
            </span>
            <div className="h-px bg-surface-alt flex-1"></div>
          </div>
          <div className="space-y-3">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                disabled={item.loading}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-[14px] bg-surface-alt flex items-center justify-center transition-transform group-active:scale-95">
                    <item.icon className="w-[18px] h-[18px] text-text-secondary group-hover:text-text transition-colors" />
                  </div>
                  <span className="text-[15px] font-semibold text-text tracking-tight">{item.label}</span>
                </div>
                {item.trailing}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-[10px] uppercase tracking-wide font-bold text-text-secondary">
              Management
            </span>
            <div className="h-px bg-surface-alt flex-1"></div>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/income')}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[14px] bg-success/10 flex items-center justify-center transition-transform group-active:scale-95">
                  <div className="w-2.5 h-2.5 rounded-full bg-success shadow-[0_0_8px_#22C55E]" />
                </div>
                <span className="text-[15px] font-semibold text-text tracking-tight">Income Management</span>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted opacity-40" />
            </button>
            <button
              onClick={() => navigate('/expenses')}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-[14px] bg-danger/10 flex items-center justify-center transition-transform group-active:scale-95">
                  <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_#EF4444]" />
                </div>
                <span className="text-[15px] font-semibold text-text tracking-tight">Expense History</span>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted opacity-40" />
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            className="flex items-center justify-between w-full group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-[14px] bg-danger/10 flex items-center justify-center transition-transform group-active:scale-95">
                <LogOut className="w-5 h-5 text-danger" />
              </div>
              <span className="text-[15px] font-semibold text-danger tracking-tight">Sign Out</span>
            </div>
            <ChevronRight className="w-5 h-5 text-danger opacity-40" />
          </button>
        </div>
      </div>
    </div>
  );
}
