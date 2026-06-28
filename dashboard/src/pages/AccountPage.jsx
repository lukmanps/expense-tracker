import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Wallet, TrendingUp, TrendingDown, Clock, ArrowRight, Loader2, 
  ArrowUpRight, ArrowDownLeft, ArrowLeftRight, 
  PieChart as PieChartIcon 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { adminService } from '../services/admin.service.js';
import useAdminStore from '../store/useAdminStore.js';
import AmountDisplay, { formatINR } from '../components/ui/AmountDisplay.jsx';
import { Button } from "@/components/ui/button";
import DateFilter, { buildFilter } from '../components/ui/DateFilter.jsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-xl text-sm">
      <p className="font-bold text-gray-800 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold" style={{ color: p.fill || p.color }}>
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

function filterToParams(filter) {
  if (!filter) return { month: dayjs().format('YYYY-MM') };
  if (filter.mode === 'range') {
    return { startDate: filter.startDate, endDate: filter.endDate };
  }
  return { month: filter.month };
}

export default function AccountPage() {
  const { userId } = useParams();
  const getAccount = useAdminStore((s) => s.getAccount);
  const getAccountColor = useAdminStore((s) => s.getAccountColor);
  const account = getAccount(userId);
  const color = getAccountColor(userId) || '#5b72ee';

  const [filter, setFilter] = useState(() =>
    buildFilter('month', {
      value: dayjs().format('YYYY-MM'),
      label: 'This Month',
    })
  );
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [userId, filter]);

  async function loadAll() {
    setLoading(true);
    try {
      const params = filterToParams(filter);
      const [sum, mon, wk, top] = await Promise.all([
        adminService.userSummary(userId, params.month || '', params.startDate, params.endDate),
        adminService.userMonthly(userId, 12),
        adminService.userWeekly(userId),
        adminService.userTopExpenses(userId, 5, params.month || '', params.startDate, params.endDate),
      ]);
      setSummary(sum);
      setMonthly(mon);
      setWeekly(wk);
      setTopExpenses(top);
    } catch {
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 border-4 shadow-sm" 
            style={{ 
              backgroundColor: `${color}15`, 
              borderColor: `${color}30` 
            }}
          >
            <span className="text-2xl font-bold tracking-wider" style={{ color }}>
              {account?.name?.charAt(0).toUpperCase() || '?'}
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                {account?.name || 'Account'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                Active Client
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
              <span>{account?.phone}</span>
              {account?.email && (
                <>
                  <span className="text-gray-300">•</span>
                  <span>{account?.email}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Quick actions direct link row */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {[
            { label: 'Expenses', to: `/accounts/${userId}/expenses`, icon: ArrowUpRight, color: 'text-rose-600 bg-rose-50/50 hover:bg-rose-50 border-rose-100 hover:border-rose-200' },
            { label: 'Income', to: `/accounts/${userId}/income`, icon: ArrowDownLeft, color: 'text-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 border-emerald-100 hover:border-emerald-200' },
            { label: 'Transactions', to: `/accounts/${userId}/transactions`, icon: ArrowLeftRight, color: 'text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 border-indigo-100 hover:border-indigo-200' },
            { label: 'Stats', to: `/accounts/${userId}/stats`, icon: PieChartIcon, color: 'text-violet-600 bg-violet-50/50 hover:bg-violet-50 border-violet-100 hover:border-violet-200' },
          ].map((l) => (
            <Button 
              key={l.to} 
              variant="outline" 
              className={`h-9 rounded-xl font-semibold border text-xs px-3.5 transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${l.color}`}
              asChild
            >
              <Link to={l.to}>
                <l.icon size={13} />
                {l.label}
              </Link>
            </Button>
          ))}
        </div>
      </div>

      {/* Proper Filter Bar */}
      <DateFilter filter={filter} onChange={setFilter} />

      {/* Stat cards */}
      {loading ? (
        <div className="py-12 flex justify-center items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" /> Loading dashboard metrics…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Balance */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div 
                className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 opacity-10 group-hover:scale-110 transition-transform duration-500" 
                style={{ backgroundColor: color }}
              />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Balance (All Time)</span>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, color: color }}>
                  <Wallet size={16} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {formatINR(summary?.balance || 0)}
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                Personal account currency
              </p>
            </div>

            {/* Card 2: Income */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 bg-emerald-500/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Income this Month</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-600 tracking-tight">
                {formatINR(summary?.monthIncome || 0)}
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Received in {summary?.month || 'this month'}
              </p>
            </div>

            {/* Card 3: Expenses */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 bg-rose-500/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Expenses this Month</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                  <TrendingDown size={16} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-rose-600 tracking-tight">
                {formatINR(summary?.monthExpense || 0)}
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1 font-medium truncate">
                <span className={`w-1.5 h-1.5 rounded-full ${summary?.monthIncome > 0 && (summary?.monthExpense / summary?.monthIncome) > 0.8 ? 'bg-rose-400' : 'bg-orange-400'}`} />
                {summary?.monthIncome > 0 
                  ? `${((summary?.monthExpense / summary?.monthIncome) * 100).toFixed(0)}% of income spent`
                  : 'Spent this period'}
              </p>
            </div>

            {/* Card 4: Pending Bills */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full -mr-8 -mt-8 bg-amber-500/10 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Bills</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-amber-600 tracking-tight">
                {formatINR((summary?.pendingToPay || 0) + (summary?.pendingToReceive || 0))}
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center justify-between truncate gap-2 font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  Pay: {formatINR(summary?.pendingToPay || 0)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Rcv: {formatINR(summary?.pendingToReceive || 0)}
                </span>
              </p>
            </div>
          </div>

          {/* Charts row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Trend (12-Month Area Chart) */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-gray-800">12-Month Trend</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Last 12 months timeline</p>
                </div>
                {/* Custom Legend */}
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                    Income
                  </span>
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                    Expense
                  </span>
                </div>
              </div>
              
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weekly Spending (Bar Chart) */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-gray-800">Weekly Spending</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Daily expenses — last 7 days</p>
                </div>
              </div>
              
              <div className="h-[240px] w-full">
                {weekly.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly} barSize={14} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc', radius: 4 }} />
                      <Bar dataKey="amount" name="Expense" fill={color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
                      <TrendingDown size={20} />
                    </div>
                    <p className="text-sm font-medium">No spending data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top expenses (Full Width Card Grid) */}
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-800">Top Expenses</h2>
              <p className="text-xs text-gray-400 mt-0.5">Highest spending occurrences this period</p>
            </div>

            {topExpenses.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                  <TrendingDown size={20} />
                </div>
                <p className="text-sm font-medium">No expenses this period</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {topExpenses.map((e, i) => {
                  const maxExpenseVal = topExpenses[0]?.amount || 1;
                  const pct = (e.amount / maxExpenseVal) * 100;
                  return (
                    <div 
                      key={e.id} 
                      className="group relative flex flex-col justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100/50 transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="w-7 h-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 shadow-sm shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-sm font-extrabold text-rose-500 shrink-0">{formatINR(e.amount)}</span>
                        </div>
                        
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-gray-800 truncate group-hover:text-primary transition-colors">{e.name}</div>
                          <div className="text-xs text-gray-400 mt-1 font-medium space-y-0.5">
                            <div className="text-gray-500 font-semibold truncate">{e.categoryName}</div>
                            <div>{format(new Date(e.date), 'MMM d, yyyy')}</div>
                          </div>
                        </div>
                      </div>

                      {/* Relative weight progress bar */}
                      <div className="w-full h-1 bg-white border border-slate-100/80 rounded-full overflow-hidden mt-4">
                        <div className="h-full bg-rose-400/50 rounded-full group-hover:bg-rose-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
