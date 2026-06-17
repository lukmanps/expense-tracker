import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, LogOut, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../store/useAuthStore.js';
import useAdminStore, { ACCOUNT_COLORS } from '../../store/useAdminStore.js';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

function formatAmount(n) {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function Sidebar() {
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const accounts = useAdminStore((s) => s.accounts);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 border-r bg-background flex flex-col h-screen overflow-y-auto">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <ShieldCheck size={20} className="text-primary-foreground" />
        </div>
        <div>
          <div className="text-lg font-bold tracking-tight text-foreground">Xpense</div>
          <div className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Admin Panel</div>
        </div>
      </div>

      <div className="px-4 py-2">
        <div className="text-xs font-semibold text-muted-foreground mb-3 px-2">Navigation</div>
        <div className="space-y-1">
          <NavLink to="/" end className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <LayoutDashboard size={18} /> Overview
          </NavLink>
          <NavLink to="/accounts" className={({ isActive }) => cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}>
            <Users size={18} /> All Accounts
          </NavLink>
        </div>
      </div>

      {/* Accounts list */}
      {accounts.length > 0 && (
        <div className="px-4 py-4 flex-1">
          <div className="text-xs font-semibold text-muted-foreground mb-3 px-2">Accounts</div>
          <div className="space-y-1">
            {accounts.map((acc, i) => {
              const color = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
              const bal = acc.balance;
              return (
                <NavLink
                  key={acc.id}
                  to={`/accounts/${acc.id}`}
                  className={({ isActive }) => cn(
                    "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                    <span className="truncate">{acc.name}</span>
                  </div>
                  <span className={cn("text-xs font-semibold", bal >= 0 ? "text-emerald-600" : "text-destructive")}>
                    {formatAmount(bal)}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin badge at bottom */}
      <div className="p-4 mt-auto border-t bg-muted/30">
        {user && (
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-9 w-9 ring-1 ring-border">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground font-medium">Administrator</div>
            </div>
          </div>
        )}
        
        <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut size={16} className="mr-2" />
          Log Out
        </Button>
      </div>
    </aside>
  );
}
