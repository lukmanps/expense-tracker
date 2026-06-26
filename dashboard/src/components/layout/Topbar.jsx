import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, HelpCircle, ChevronDown, Check, X } from 'lucide-react';
import useAdminStore, { ACCOUNT_COLORS } from '../../store/useAdminStore.js';

function getPageTitle(pathname, accounts) {
  if (pathname === '/' || pathname === '') return 'Dashboard';
  if (pathname === '/transactions') return 'Transactions';
  if (pathname === '/accounts') return 'Customers';
  if (pathname.startsWith('/accounts/')) {
    const parts = pathname.split('/').filter(Boolean);
    const acc = accounts.find((a) => a.id === parts[1]);
    const name = acc?.name || 'Account';
    if (parts.length === 2) return name;
    const sub = parts[2];
    if (sub === 'expenses') return 'Expenses';
    if (sub === 'income') return 'Income';
    if (sub === 'transactions') return 'Transactions';
    if (sub === 'stats') return 'Statistics';
    return name;
  }
  return 'Dashboard';
}

function formatAmount(n) {
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (Math.abs(n) >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const accounts = useAdminStore((s) => s.accounts);
  const selectedAccountId = useAdminStore((s) => s.selectedAccountId);
  const setSelectedAccount = useAdminStore((s) => s.setSelectedAccount);

  const pageTitle = getPageTitle(location.pathname, accounts);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const selectedIdx = accounts.findIndex((a) => a.id === selectedAccountId);
  const selectedColor =
    selectedIdx >= 0 ? ACCOUNT_COLORS[selectedIdx % ACCOUNT_COLORS.length] : '#6366f1';

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  const searchResults = searchQuery
    ? accounts.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.phone && a.phone.includes(searchQuery))
      )
    : [];

  // ── Account dropdown ───────────────────────────────────────────────────────
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery('');
      }
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center px-5 gap-4 shrink-0">
      {/* Page title */}
      <h1 className="text-lg font-bold text-gray-900 shrink-0 min-w-[110px]">{pageTitle}</h1>

      {/* ── Search bar (center) ─────────────────────────────────────────────── */}
      <div ref={searchRef} className="flex-1 max-w-sm mx-auto relative">
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchOpen && searchQuery && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3.5 text-sm text-gray-400 text-center">No accounts found</div>
            ) : (
              searchResults.map((acc, i) => {
                const color = ACCOUNT_COLORS[accounts.indexOf(acc) % ACCOUNT_COLORS.length];
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      navigate(`/accounts/${acc.id}`);
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{acc.name}</div>
                      {acc.phone && <div className="text-xs text-gray-400">{acc.phone}</div>}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        (acc.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {formatAmount(acc.balance ?? 0)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Right icons ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>

        {/* Help */}
        <button className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
          <HelpCircle size={16} />
        </button>

        {/* ── Account selector ─────────────────────────────────────── */}
        {accounts.length > 0 && (
          <div ref={accountRef} className="relative">
            <button
              onClick={() => setAccountOpen((v) => !v)}
              aria-label="Select account"
              aria-expanded={accountOpen}
              className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: selectedColor }}
              >
                {selectedAccount?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
              {/* Name */}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-gray-800 leading-tight max-w-[90px] truncate">
                  {selectedAccount?.name ?? 'Select'}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">Account</div>
              </div>
              <ChevronDown
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${accountOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown */}
            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2.5 border-b border-gray-50">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Account</p>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {accounts.map((acc, i) => {
                    const color = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                    const isSelected = acc.id === selectedAccountId;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => { setSelectedAccount(acc.id); setAccountOpen(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-primary/5' : ''
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: color }}
                        >
                          {acc.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-semibold text-gray-800 truncate">{acc.name}</div>
                          {acc.phone && <div className="text-xs text-gray-400">{acc.phone}</div>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span
                            className={`text-xs font-semibold ${
                              (acc.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
                            }`}
                          >
                            {formatAmount(acc.balance ?? 0)}
                          </span>
                          {isSelected && <Check size={12} className="text-primary ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
