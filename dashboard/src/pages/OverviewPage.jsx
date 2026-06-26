import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { Table, Tag } from 'antd';
import {
  TrendingUp, TrendingDown, Wallet, Search, Clock,
  BarChart2, ArrowRight, Loader2, SlidersHorizontal, ChevronDown,
  Users,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { adminService } from '../services/admin.service.js';
import useAdminStore, { ACCOUNT_COLORS } from '../store/useAdminStore.js';
import { formatINR } from '../components/ui/AmountDisplay.jsx';
import DateFilter, { buildFilter } from '../components/ui/DateFilter.jsx';
import { cn } from '@/lib/utils';

// Primary colour constant (matches --primary in index.css: hsl(232 82% 58%))
const PRIMARY = '#5b72ee';
const PRIMARY_LIGHT = '#dde3fb';
const ORANGE = '#fb923c';
const ORANGE_LIGHT = '#fed7aa';

// ─── Custom chart tooltip ──────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-xl text-sm">
      <p className="font-bold text-gray-800 mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-medium" style={{ color: p.fill }}>
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
    </div>
  );
};

// ─── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, loading }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1 truncate">
            {loading
              ? <span className="inline-block w-28 h-7 bg-gray-100 rounded-lg animate-pulse" />
              : value}
          </p>
          <p className="text-xs text-gray-400 mt-2">{sub}</p>
        </div>
        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', iconBg)}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
    </div>
  );
}

// ─── Build API params from filter ─────────────────────────────────────────────
/**
 * Converts the DateFilter's output into params understood by the server.
 * - quick / month  → pass `month` string
 * - range          → pass `startDate` + `endDate`
 */
function filterToParams(filter) {
  if (!filter) return { month: dayjs().format('YYYY-MM') };
  if (filter.mode === 'range') {
    return { startDate: filter.startDate, endDate: filter.endDate };
  }
  return { month: filter.month };
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const accounts = useAdminStore((s) => s.accounts);
  const selectedAccountId = useAdminStore((s) => s.selectedAccountId);
  const selectedIdx = accounts.findIndex((a) => a.id === selectedAccountId);
  const selectedAccount = selectedIdx >= 0 ? accounts[selectedIdx] : null;
  const selectedColor =
    selectedIdx >= 0 ? ACCOUNT_COLORS[selectedIdx % ACCOUNT_COLORS.length] : '#6366f1';

  // Global date filter — default to current month
  const [filter, setFilter] = useState(() =>
    buildFilter('month', {
      value: dayjs().format('YYYY-MM'),
      label: 'This Month',
    })
  );

  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTx, setSearchTx] = useState('');

  useEffect(() => {
    if (selectedAccountId) loadData(selectedAccountId);
  }, [selectedAccountId, filter]);

  async function loadData(userId) {
    setLoading(true);
    try {
      const params = filterToParams(filter);

      const [sum, mon, cats, rec] = await Promise.all([
        adminService.userSummary(userId, params.month, params.startDate, params.endDate),
        adminService.userMonthly(userId, 12),
        adminService.userCategoryBreakdown(userId, params.month, params.startDate, params.endDate),
        adminService.userRecent(userId, 10, params.month, params.startDate, params.endDate),
      ]);

      setSummary(sum);
      setMonthly(mon);
      setCategories(cats);
      setRecent(rec.data || []);
    } catch {
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  }

  if (!selectedAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Users size={42} className="mb-4 opacity-30" />
        <p className="font-semibold text-gray-600">No account selected</p>
        <p className="text-sm mt-1">Select an account from the top-bar dropdown.</p>
      </div>
    );
  }

  const monthIncome = summary?.monthIncome ?? 0;
  const monthExpense = summary?.monthExpense ?? 0;
  const balance = summary?.balance ?? 0;
  const currentMonthShort = dayjs().format('MMM');
  const spendPct = monthIncome > 0 ? Math.min(100, (monthExpense / monthIncome) * 100) : 0;
  const topCats = categories.slice(0, 3);
  const otherAmt = categories.slice(3).reduce((s, c) => s + c.amount, 0);
  const filteredRecent = recent.filter(
    (r) => !searchTx || r.title.toLowerCase().includes(searchTx.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300">

      {/* ── Global Date Filter Bar ─────────────────────────────────────────── */}
      <DateFilter filter={filter} onChange={setFilter} />

      {/* ── Row 1 — Stat Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label={`Income · ${filter.label}`}
          value={formatINR(monthIncome)}
          sub={`All time: ${formatINR(selectedAccount.totalIncome ?? 0)}`}
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          loading={loading}
        />
        <StatCard
          label={`Expenses · ${filter.label}`}
          value={formatINR(monthExpense)}
          sub={`All time: ${formatINR(selectedAccount.totalExpense ?? 0)}`}
          icon={TrendingDown}
          iconBg="bg-red-50"
          iconColor="text-red-500"
          loading={loading}
        />
        <StatCard
          label="Balance (All Time)"
          value={formatINR(balance)}
          sub={`Net this period: ${formatINR(monthIncome - monthExpense)}`}
          icon={Wallet}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          loading={loading}
        />
      </div>

      {/* ── Row 2 — Chart + Spending Overview ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Transactions Overview */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Transactions Overview</h2>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading
                  ? <span className="inline-block w-36 h-7 bg-gray-100 rounded-lg animate-pulse" />
                  : formatINR(monthIncome + monthExpense)}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{filter.label}</p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIMARY }} />
              Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ORANGE }} />
              Expense
            </span>
          </div>

          {/* Chart */}
          {monthly.length > 0 ? (
            <div className="h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthly}
                  barSize={10}
                  barGap={3}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
                  <Bar dataKey="income" name="Income" radius={[5, 5, 0, 0]}>
                    {monthly.map((entry, i) => (
                      <Cell
                        key={`inc-${i}`}
                        fill={entry.month === currentMonthShort ? PRIMARY : PRIMARY_LIGHT}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="expense" name="Expense" radius={[5, 5, 0, 0]}>
                    {monthly.map((entry, i) => (
                      <Cell
                        key={`exp-${i}`}
                        fill={entry.month === currentMonthShort ? ORANGE : ORANGE_LIGHT}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[210px] flex items-center justify-center text-gray-400 text-sm gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading chart…
            </div>
          )}
        </div>

        {/* Spending Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <BarChart2 size={15} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">Spending Overview</h2>
              <p className="text-[11px] text-gray-400">{filter.label}</p>
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-end gap-2">
              <span className="text-[26px] font-bold text-gray-900 leading-none">
                {loading
                  ? <span className="inline-block w-32 h-7 bg-gray-100 rounded-lg animate-pulse" />
                  : formatINR(monthExpense)}
              </span>
              {monthIncome > 0 && !loading && (
                <span className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full mb-0.5',
                  spendPct > 80 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                )}>
                  {spendPct.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1.5">From {formatINR(monthIncome)} income</p>
          </div>

          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-5">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${spendPct}%`,
                background: `linear-gradient(90deg, ${PRIMARY}, #a78bfa)`,
              }}
            />
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No expenses this period</p>
          ) : (
            <div className="space-y-3.5 flex-1">
              {topCats.map((cat) => (
                <div key={cat.categoryId} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-3 h-3 rounded-[3px] shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-gray-600 truncate">{cat.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-800 shrink-0">{formatINR(cat.amount)}</span>
                </div>
              ))}
              {otherAmt > 0 && (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-3 h-3 rounded-[3px] bg-gray-300 shrink-0" />
                    <span className="text-sm text-gray-400 truncate">Others</span>
                  </div>
                  <span className="text-sm font-bold text-gray-500 shrink-0">{formatINR(otherAmt)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3 — Account Details + Recent Transactions ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Account Details */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Account Details</h2>

          {/* Gradient card */}
          <div
            className="rounded-2xl p-5 mb-4 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${selectedColor}ee 0%, ${selectedColor}88 100%)`,
            }}
          >
            <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute right-4 -bottom-8 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-white/25 flex items-center justify-center font-bold text-lg shrink-0">
                  {selectedAccount?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-bold leading-tight truncate">{selectedAccount?.name}</div>
                  <div className="text-white/70 text-xs mt-0.5">{selectedAccount?.phone || 'No phone'}</div>
                </div>
              </div>
              <div className="text-2xl font-bold">{formatINR(balance)}</div>
              <div className="text-white/65 text-xs mt-0.5">All-time balance</div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-emerald-50 rounded-xl p-3.5">
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wide mb-1">Income</p>
              <p className="text-[15px] font-bold text-emerald-700">{formatINR(monthIncome)}</p>
              <p className="text-[10px] text-emerald-400 mt-0.5">{filter.label}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-3.5">
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide mb-1">Expense</p>
              <p className="text-[15px] font-bold text-red-600">{formatINR(monthExpense)}</p>
              <p className="text-[10px] text-red-400 mt-0.5">{filter.label}</p>
            </div>
          </div>

          {((summary?.pendingToPay ?? 0) + (summary?.pendingToReceive ?? 0)) > 0 && (
            <div className="bg-amber-50 rounded-xl p-3.5 mb-3">
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide mb-1">
                <Clock size={10} className="inline mr-1" />Pending Bills
              </p>
              <p className="text-[15px] font-bold text-amber-700">
                {formatINR((summary.pendingToPay ?? 0) + (summary.pendingToReceive ?? 0))}
              </p>
              <p className="text-[10px] text-amber-400 mt-0.5">
                Pay: {formatINR(summary.pendingToPay ?? 0)} · Rcv: {formatINR(summary.pendingToReceive ?? 0)}
              </p>
            </div>
          )}

          <Link
            to={`/accounts/${selectedAccountId}`}
            className="flex items-center justify-center gap-1.5 text-sm font-semibold text-primary hover:underline mt-1"
          >
            View Full Profile <ArrowRight size={14} />
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Recent Transactions</h2>
              <p className="text-[11px] text-gray-400">{filter.label}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search"
                  value={searchTx}
                  onChange={(e) => setSearchTx(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-primary/20 w-28 transition-all"
                />
              </div>
              <button className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 font-medium whitespace-nowrap">
                <SlidersHorizontal size={12} />
                Sort by
                <ChevronDown size={11} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex items-center justify-center text-gray-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : (
            <Table
              columns={[
                {
                  title: '',
                  dataIndex: 'type',
                  key: 'icon',
                  width: 50,
                  render: (v) => (
                    <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-base shrink-0">
                      {v === 'income' ? '💰' : '💸'}
                    </div>
                  ),
                },
                {
                  title: 'Description',
                  dataIndex: 'title',
                  key: 'title',
                  render: (v) => <span className="text-sm font-semibold text-gray-800 block truncate max-w-[130px]">{v}</span>,
                },
                {
                  title: 'Date',
                  dataIndex: 'date',
                  key: 'date',
                  responsive: ['sm'],
                  render: (v) => <span className="text-xs text-gray-400 whitespace-nowrap">{format(new Date(v), 'dd MMM, yyyy')}</span>,
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  align: 'right',
                  render: (v, row) => (
                    <span className={cn('text-sm font-bold tabular-nums', row.type === 'income' ? 'text-emerald-600' : 'text-red-500')}>
                      {row.type === 'income' ? '+' : '-'}{formatINR(Math.abs(v))}
                    </span>
                  ),
                },
                {
                  title: 'Status',
                  key: 'status',
                  render: (_, row) => (
                    <Tag className={row.type === 'income' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-500 border-red-200'} style={{ borderRadius: 9999 }}>
                      {row.type === 'income' ? '● Income' : '● Expense'}
                    </Tag>
                  ),
                },
              ]}
              dataSource={filteredRecent}
              rowKey="id"
              pagination={false}
              size="small"
              className="mt-2"
            />
          )}
        </div>
      </div>
    </div>
  );
}
