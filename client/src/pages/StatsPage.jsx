import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Download } from 'lucide-react';
import { statsService } from '../services/stats.service';
import Card from '../components/ui/Card';
import FilterChips from '../components/ui/FilterChips';
import { DashboardSkeleton } from '../components/ui/SkeletonLoader';
import { getIcon } from '../components/ui/CategoryGrid';

const tabs = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'categories', label: 'Categories' },
];

const monthlyPeriodOptions = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: '3months', label: 'Last 3M' },
  { value: '6months', label: 'Last 6M' },
];

const categoryPeriodOptions = [
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: 'all', label: 'All Time' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length > 0) {
    return (
      <div className="bg-[#0a0a0b]/90 border border-white/5 backdrop-blur-xl rounded-2xl p-3 shadow-2xl text-[10px] font-bold">
        <p className="text-white/40 mb-1 uppercase tracking-[0.2em]">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="font-black text-sm capitalize" style={{ color: entry.color || entry.fill || 'white' }}>
            {entry.name === 'income' ? '+' : entry.name === 'expense' ? '-' : ''}
            ₹{entry.value?.toLocaleString()}
            {payload.length > 1 && (
              <span className="ml-1 text-[9px] font-semibold opacity-60">{entry.name}</span>
            )}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const formatYAxis = (v) =>
  v >= 1000 ? `₹${(v / 1000).toFixed(v % 1000 !== 0 ? 1 : 0)}k` : `₹${v}`;

export default function StatsPage() {
  const [tab, setTab] = useState('weekly');
  const [monthlyPeriod, setMonthlyPeriod] = useState('this_month');
  const [categoryPeriod, setCategoryPeriod] = useState('all');

  const [weekly, setWeekly] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);      // month-level (3m / 6m)
  const [monthlyWeekly, setMonthlyWeekly] = useState([]);  // week-level (this month)
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [topExpenses, setTopExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [topExpensesLoading, setTopExpensesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [w, mw, m3, c, s, te] = await Promise.all([
        statsService.weekly(),
        statsService.monthlyWeekly(),
        statsService.monthly(6),
        statsService.categoryBreakdown(),          // all-time by default
        statsService.dashboard(),
        statsService.topExpenses(5, 'week'),        // matches default weekly tab
      ]);
      setWeekly(w.data);
      setMonthlyWeekly(mw.data);
      setMonthlyData(m3.data);
      setCategories(c.data);
      setSummary(s);
      setTopExpenses(te.data);
    } catch {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = useCallback(async (newTab) => {
    setTab(newTab);
    if (newTab === 'weekly' || newTab === 'monthly') {
      const period = newTab === 'weekly' ? 'week' : (monthlyPeriod === 'this_month' ? 'month' : undefined);
      setTopExpensesLoading(true);
      try {
        const te = await statsService.topExpenses(5, period);
        setTopExpenses(te.data);
      } catch {
        toast.error('Failed to load top expenses');
      } finally {
        setTopExpensesLoading(false);
      }
    }
  }, [monthlyPeriod]);

  const handleMonthlyPeriodChange = useCallback(async (period) => {
    setMonthlyPeriod(period);
    setChartLoading(true);
    setTopExpensesLoading(true);
    try {
      const topPeriod = period === 'this_month' ? 'month' : period === 'last_month' ? 'last_month' : undefined;
      const [chartRes, teRes] = await Promise.all([
        period === 'this_month'
          ? statsService.monthlyWeekly()
          : period === 'last_month'
          ? statsService.lastMonthWeekly()
          : statsService.monthly(period === '3months' ? 3 : 6),
        statsService.topExpenses(5, topPeriod),
      ]);
      if (period === 'this_month' || period === 'last_month') {
        setMonthlyWeekly(chartRes.data);
      } else {
        setMonthlyData(chartRes.data);
      }
      setTopExpenses(teRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setChartLoading(false);
      setTopExpensesLoading(false);
    }
  }, []);

  const handleCategoryPeriodChange = useCallback(async (period) => {
    setCategoryPeriod(period);
    setCategoriesLoading(true);
    try {
      const c = await statsService.categoryBreakdown(period === 'all' ? undefined : period);
      setCategories(c.data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      await statsService.exportCSV();
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const totalCategoryAmount = categories.reduce((s, c) => s + c.amount, 0);

  // Determine what data / label the monthly chart uses
  const monthlyChartData = (monthlyPeriod === 'this_month' || monthlyPeriod === 'last_month') ? monthlyWeekly : monthlyData;
  const monthlyChartTitle =
    monthlyPeriod === 'this_month'
      ? `${summary?.month || 'This Month'} — by Week`
      : monthlyPeriod === 'last_month'
      ? 'Last Month — by Week'
      : monthlyPeriod === '3months'
      ? 'Last 3 Months'
      : 'Last 6 Months';

  const topExpensesLabel =
    tab === 'weekly'
      ? 'this week'
      : monthlyPeriod === 'this_month'
      ? 'this month'
      : monthlyPeriod === 'last_month'
      ? 'last month'
      : monthlyPeriod === '3months'
      ? 'last 3 months'
      : 'last 6 months';

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in bg-bg">
      {/* Header */}
      <div
        className="flex-shrink-0 relative overflow-hidden pb-4"
        style={{ background: 'linear-gradient(180deg, rgba(204, 237, 133, 0.15) 0%, transparent 100%)' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

        <div className="px-5 pt-4 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[32px] font-black text-text tracking-tight">
              Statistics<span className="text-primary">.</span>
            </h1>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-alt/30 border border-border/20 text-text-muted hover:text-text hover:bg-surface-alt/50 transition-all text-[11px] font-bold disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6 px-1">
            <ArrowUpRight className="w-8 h-8 text-danger" strokeWidth={3} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-text-muted mb-0.5">
                {summary?.month || 'This Month'} Expense
              </span>
              <span className="text-4xl font-semibold text-text tracking-tighter leading-none">
                ₹{(summary?.monthExpense || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <FilterChips options={tabs} selected={tab} onSelect={handleTabChange} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* ── Weekly Tab ── */}
        {tab === 'weekly' && (
          <div className="space-y-3">
            <Card className="p-4 rounded-lg!">
              <div className="mb-4">
                <span className="text-sm font-semibold text-text">Weekly Activity</span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekly} barSize={36} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.1} />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} dy={15} />
                    <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-alt)', opacity: 0.2 }} />
                    <Bar dataKey="amount" fill="url(#barGradient)" radius={[12, 12, 12, 12]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <TopExpensesCard items={topExpenses} loading={topExpensesLoading} label={topExpensesLabel} />
          </div>
        )}

        {/* ── Monthly Tab ── */}
        {tab === 'monthly' && (
          <div className="space-y-3">
            <Card className="p-4 rounded-lg!">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-text">{monthlyChartTitle}</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-text-muted">
                    <span className="w-2 h-2 rounded-full bg-success inline-block" /> Income
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-text-muted">
                    <span className="w-2 h-2 rounded-full bg-danger inline-block" /> Expense
                  </span>
                </div>
              </div>

              <FilterChips
                options={monthlyPeriodOptions}
                selected={monthlyPeriod}
                onSelect={handleMonthlyPeriodChange}
              />

              <div className="h-[200px] w-full mt-4">
                {chartLoading ? (
                  <div className="h-full flex items-center justify-center text-text-muted text-sm opacity-50">
                    Loading…
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.1} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} dy={15} />
                      <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            <TopExpensesCard items={topExpenses} loading={topExpensesLoading} label={topExpensesLabel} />
          </div>
        )}

        {/* ── Categories Tab ── */}
        {tab === 'categories' && (
          <div className="space-y-3">
            <Card className="p-4 rounded-xl!">
              <div className="mb-3">
                <span className="text-sm font-semibold text-text">Distribution Breakdown</span>
              </div>

              <FilterChips
                options={categoryPeriodOptions}
                selected={categoryPeriod}
                onSelect={handleCategoryPeriodChange}
              />

              <div className="mt-4">
                {categoriesLoading ? (
                  <p className="text-center text-text-muted text-sm py-12 italic opacity-50">Loading…</p>
                ) : categories.length === 0 ? (
                  <p className="text-center text-text-muted text-sm py-12 italic opacity-50">No data available</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex h-3 w-full rounded-full overflow-hidden bg-surface-alt/20 mb-4 border border-border/5">
                      {categories.map((cat, i) => {
                        const pct = totalCategoryAmount ? (cat.amount / totalCategoryAmount) * 100 : 0;
                        return (
                          <div
                            key={`seg-${i}`}
                            style={{ width: `${pct}%`, backgroundColor: cat.color }}
                            className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-80 transition-opacity"
                            title={`${cat.name}: ${pct.toFixed(1)}%`}
                          />
                        );
                      })}
                    </div>

                    <div className="divide-y divide-border/10">
                      {categories.map((cat) => {
                        const IconComp = getIcon(cat.icon);
                        const pct = totalCategoryAmount ? ((cat.amount / totalCategoryAmount) * 100).toFixed(1) : 0;
                        return (
                          <div key={cat.categoryId} className="flex items-center gap-3 py-2">
                            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                              <IconComp className="w-4 h-4" style={{ color: cat.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[13px] font-bold text-text tracking-tight truncate">{cat.name}</span>
                                <span className="text-[13px] font-black text-text tabular-nums">₹{cat.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-surface-alt/30 rounded-full h-[3px] overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                                </div>
                                <span className="text-[9px] font-bold tabular-nums text-text-muted opacity-60 w-8 text-right shrink-0">{pct}%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function TopExpensesCard({ items, loading, label }) {
  return (
    <Card className="p-4 rounded-xl!">
      <div className="mb-4">
        <span className="text-sm font-semibold text-text">
          Top 5 Expenses
          <span className="ml-1.5 text-[10px] font-semibold text-text-muted opacity-60">({label})</span>
        </span>
      </div>
      <div className="space-y-1">
        {loading ? (
          <p className="text-center text-text-muted text-sm py-8 italic opacity-50">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-center text-text-muted text-sm py-8 italic opacity-50">No data available</p>
        ) : (
          items.map((item, idx) => {
            const IconComp = getIcon(item.icon);
            return (
              <div key={idx} className="flex items-center gap-3 py-2 px-1">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                  <IconComp className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-text truncate tracking-tight opacity-90">{item.name || item.categoryName}</p>
                </div>
                <p className="text-[13px] font-black tabular-nums text-text border-b border-border/10 pb-0.5">
                  -₹{item.amount.toLocaleString()}
                </p>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
