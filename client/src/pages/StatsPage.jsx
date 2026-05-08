import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Download, ChevronDown } from 'lucide-react';
import { statsService } from '../services/stats.service';
import Card from '../components/ui/Card';
import FilterChips from '../components/ui/FilterChips';
import { DashboardSkeleton } from '../components/ui/SkeletonLoader';
import { getIcon } from '../components/ui/CategoryGrid';

const tabs = [
  { value: 'overview', label: 'Overview' },
  { value: 'categories', label: 'Categories' },
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

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function StatsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const selectedMonth = searchParams.get('month') || getCurrentMonth();

  const monthOptions = useMemo(() => {
    const opts = [
      { value: '3months', label: 'Last 3 Months' },
      { value: '6months', label: 'Last 6 Months' },
      { value: 'all', label: 'All Time' },
    ];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      opts.push({ value, label });
    }
    return opts;
  }, []);

  const [monthlyWeekly, setMonthlyWeekly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [topExpenses, setTopExpenses] = useState([]);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadAll(selectedMonth);
  }, [selectedMonth]);

  const loadAll = async (monthStr = selectedMonth) => {
    try {
      const [mw, c, s, te] = await Promise.all([
        statsService.monthlyWeekly(monthStr),
        statsService.categoryBreakdown(monthStr),
        statsService.dashboard(monthStr),
        statsService.topExpenses(5, monthStr),
      ]);
      setMonthlyWeekly(mw.data);
      setCategories(c.data);
      setSummary(s);
      setTopExpenses(te.data);
    } catch {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleGlobalMonthChange = (month) => {
    setSearchParams(prev => {
      prev.set('month', month);
      return prev;
    }, { replace: true });
  };

  const handleTabChange = (newTab) => {
    setSearchParams(prev => {
      prev.set('tab', newTab);
      return prev;
    }, { replace: true });
  };

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

  const isRolling = selectedMonth === '3months' || selectedMonth === '6months' || selectedMonth === 'all';
  const monthlyChartTitle = isRolling ? `${summary?.month || ''} — by Month` : `${summary?.month || 'This Month'} — by Week`;
  const topExpensesLabel = summary?.month || 'this period';

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
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) => handleGlobalMonthChange(e.target.value)}
                  className="appearance-none bg-surface-alt/40 border border-border/20 text-text text-[11px] font-bold rounded-xl pl-3 pr-7 py-1.5 focus:outline-none cursor-pointer"
                >
                  {monthOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-alt/30 border border-border/20 text-text-muted hover:text-text hover:bg-surface-alt/50 transition-all text-[11px] font-bold disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>
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
        {/* ── Overview Tab ── */}
        {tab === 'overview' && (
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

              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyWeekly} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
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
              </div>
            </Card>

            <TopExpensesCard items={topExpenses} label={topExpensesLabel} />
          </div>
        )}

        {/* ── Categories Tab ── */}
        {tab === 'categories' && (
          <div className="space-y-3">
            <Card className="p-4 rounded-xl!">
              <div className="mb-3">
                <span className="text-sm font-semibold text-text">Distribution Breakdown</span>
              </div>

              <div className="mt-4">
                {categories.length === 0 ? (
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

function TopExpensesCard({ items, label }) {
  return (
    <Card className="p-4 rounded-xl!">
      <div className="mb-4">
        <span className="text-sm font-semibold text-text">
          Top 5 Expenses
          <span className="ml-1.5 text-[10px] font-semibold text-text-muted opacity-60">({label})</span>
        </span>
      </div>
      <div className="space-y-1">
        {items.length === 0 ? (
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
