import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, LogOut, ShieldCheck, ArrowLeftRight,
} from 'lucide-react';
import useAuthStore from '../../store/useAuthStore.js';
import useAdminStore, { ACCOUNT_COLORS } from '../../store/useAdminStore.js';
import { cn } from '@/lib/utils';

function formatAmount(n) {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

const navClass = ({ isActive }) =>
  cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full',
    isActive
      ? 'bg-primary/10 text-primary font-semibold'
      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
  );

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
    <aside className="w-[218px] shrink-0 bg-white border-r border-gray-100 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-5 py-4 flex items-center gap-2.5 border-b border-gray-50">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <div className="text-[15px] font-bold text-gray-900 leading-tight">Xpense</div>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">Admin Panel</div>
        </div>
      </div>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">

        {/* ── Menu ── */}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-5 pb-2 select-none">Menu</p>
        <nav className="space-y-0.5">
          <NavLink to="/" end className={navClass}>
            <LayoutDashboard size={16} /> Dashboard
          </NavLink>
          <NavLink to="/transactions" className={navClass}>
            <ArrowLeftRight size={16} /> Transactions
          </NavLink>
          <NavLink to="/accounts" className={navClass}>
            <Users size={16} /> Customers
          </NavLink>
        </nav>

        {/* ── Accounts mini-list ── */}
        {accounts.length > 0 && (
          <>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-5 pb-2 select-none">Accounts</p>
            <div className="space-y-0.5">
              {accounts.slice(0, 7).map((acc, i) => {
                const color = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                const bal = acc.balance ?? 0;
                return (
                  <NavLink
                    key={acc.id}
                    to={`/accounts/${acc.id}`}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                      )
                    }
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate">{acc.name}</span>
                    </div>
                    <span
                      className={cn(
                        'text-[11px] font-semibold shrink-0 ml-1',
                        bal >= 0 ? 'text-emerald-600' : 'text-red-500'
                      )}
                    >
                      {formatAmount(bal)}
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </>
        )}

        {/* ── Actions ── */}
        <div className="mt-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full text-left"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>

      {/* ── Admin badge ── */}
      {user && (
        <div className="p-3 border-t border-gray-100">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">{user.name}</div>
                <div className="text-[10px] text-gray-400 font-medium">Administrator</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
