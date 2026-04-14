import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, BarChart3, Plus, Receipt, User, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/stats', icon: BarChart3, label: 'Statistics' },
  { to: null, icon: Plus, label: 'Add', isFab: true },
  { to: '/bills', icon: Receipt, label: 'Bills' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const fabActions = [
  { label: 'Expense', icon: ArrowUpRight, path: '/add-expense', color: '#EF4444' },
  { label: 'Income', icon: ArrowDownLeft, path: '/add-income', color: '#22C55E' },
  { label: 'Bill', icon: Receipt, path: '/add-bill', color: '#C8E972' },
];

export default function BottomNav() {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleFabAction = (path) => {
    setShowMenu(false);
    navigate(path);
  };

  return (
    <>
      {/* Backdrop */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* FAB Menu */}
      {showMenu && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 animate-fade-in">
          {fabActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleFabAction(action.path)}
              className="flex items-center gap-3 px-5 py-3 bg-surface rounded-2xl shadow-lg min-w-[160px] active:scale-95 transition-transform"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${action.color}20` }}
              >
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <span className="text-sm font-semibold text-text">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-around max-w-lg mx-auto h-16">
          {navItems.map((item) => {
            if (item.isFab) {
              return (
                <button
                  key="fab"
                  onClick={() => setShowMenu((prev) => !prev)}
                  className={`flex items-center justify-center w-14 h-14 -mt-7 rounded-full shadow-lg active:scale-95 transition-all ${
                    showMenu ? 'bg-danger rotate-45' : 'bg-primary'
                  }`}
                  id="fab-add"
                >
                  <Plus className="w-7 h-7 text-bg-dark" strokeWidth={2.5} />
                </button>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 py-1 px-3 min-w-[56px] transition-colors ${
                    isActive ? 'text-primary-dark' : 'text-text-muted'
                  }`
                }
                id={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}
