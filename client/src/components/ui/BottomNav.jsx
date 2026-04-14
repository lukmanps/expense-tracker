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
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 animate-fade-in w-full max-w-[200px] px-4">
          {fabActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleFabAction(action.path)}
              className="group flex items-center justify-between w-full px-4 py-3 bg-surface/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl active:scale-95 transition-all"
            >
              <span className="text-sm font-bold text-text/90 tracking-wide">{action.label}</span>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <action.icon className="w-5 h-5 shadow-sm" style={{ color: action.color }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Nav Bar Container */}
      <div className="fixed bottom-6 left-0 right-0 z-50 px-6 pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <nav className="max-w-xl mx-auto h-20 bg-surface/70 backdrop-blur-2xl border border-white/5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto overflow-visible relative">
          <div className="flex items-center justify-around h-full px-4 relative">
            {navItems.map((item, index) => {
              if (item.isFab) {
                return (
                  <div key="fab-container" className="relative -top-8">
                    <button
                      onClick={() => setShowMenu((prev) => !prev)}
                      className={`group relative flex items-center justify-center w-16 h-16 rounded-[22px] shadow-[0_12px_24px_rgba(200,233,114,0.3)] active:scale-90 transition-all duration-300 ${
                        showMenu ? 'bg-danger' : 'bg-[#C8E972]'
                      }`}
                      id="fab-add"
                    >
                      <Plus 
                        className={`w-8 h-8 text-black transition-transform duration-500 ${showMenu ? 'rotate-[135deg]' : 'rotate-0'}`} 
                        strokeWidth={2.5} 
                      />
                      {/* Sub-glow/Reflected light */}
                      {!showMenu && <div className="absolute inset-0 rounded-[22px] bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
                    </button>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `relative flex flex-col items-center justify-center h-full px-4 transition-all duration-300 ${
                      isActive ? 'text-[#C8E972]' : 'text-text/40 hover:text-text/70'
                    }`
                  }
                  id={`nav-${item.label.toLowerCase()}`}
                >
                  {({ isActive }) => (
                    <>
                      <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 2} />
                      <span className={`text-[10px] font-bold mt-1 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0 h-0'}`}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="absolute -bottom-1 w-1 h-1 bg-[#C8E972] rounded-full shadow-[0_0_10px_#C8E972]" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
