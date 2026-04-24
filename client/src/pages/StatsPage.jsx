import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight } from 'lucide-react';
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.[0]) {
    return (
      <div className="bg-[#0a0a0b]/90 border border-white/5 backdrop-blur-xl rounded-2xl p-3 shadow-2xl text-[10px] font-bold">
        <p className="text-white/40 mb-1 uppercase tracking-[0.2em]">{label}</p>
        <p className="text-white font-black text-sm">₹{payload[0].value?.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function StatsPage() {
  const [tab, setTab] = useState('weekly');
  const [weekly, setWeekly] = useState([]);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState(null);
  const [topExpenses, setTopExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [w, m, c, s, te] = await Promise.all([
        statsService.weekly(),
        statsService.monthly(),
        statsService.categoryBreakdown(),
        statsService.dashboard(),
        statsService.topExpenses(5),
      ]);
      setWeekly(w.data);
      setMonthly(m.data);
      setCategories(c.data);
      setSummary(s);
      setTopExpenses(te.data);
    } catch {
      toast.error('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const totalCategoryAmount = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in bg-bg">
      {/* Top Section */}
      <div className="flex-shrink-0 relative overflow-hidden pb-4"
        style={{
          background: 'linear-gradient(180deg, rgba(204, 237, 133, 0.15) 0%, transparent 100%)',
        }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />

        <div className="px-5 pt-4 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[32px] font-black text-text tracking-tight">
              Statistics<span className="text-primary">.</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 mb-4 px-1">
            <ArrowUpRight className="w-8 h-8 text-danger" strokeWidth={3} />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-text-muted mb-0.5">Total Expense</span>
              <span className="text-[32px] font-semibold text-text tracking-tighter leading-none">₹{(summary?.totalExpense || 0).toLocaleString()}</span>
            </div>
          </div>

          <FilterChips options={tabs} selected={tab} onSelect={setTab} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-1 pb-32">
        {/* Weekly/Monthly Chart View */}
        {(tab === 'weekly' || tab === 'monthly') && (
          <div className="space-y-3">
            <Card className="p-4 !rounded-lg">
              <div className="mb-4">
                <span className="text-sm font-semibold text-text">
                  {tab === 'weekly' ? 'Weekly Activity' : 'Monthly Growth'}
                </span>
              </div>

              {tab === 'weekly' ? (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly} barSize={36} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.1} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} dy={15} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} width={25} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-alt)', opacity: 0.2 }} />
                      <Bar dataKey="amount" fill="url(#barGradient)" radius={[12, 12, 12, 12]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthly} margin={{ left: -20, right: 0, top: 10, bottom: 0 }}>
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
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} width={25} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Top 5 Expenses section */}
            <Card className="p-4 !rounded-xl">
              <div className="mb-4">
                <span className="text-sm font-semibold text-text">
                  Top 5 Expenses
                </span>
              </div>
              <div className="space-y-1">
                {topExpenses.length === 0 ? (
                  <p className="text-center text-text-muted text-sm py-8 italic opacity-50">No data available</p>
                ) : (
                  topExpenses.map((item, idx) => {
                    const IconComp = getIcon(item.icon);
                    return (
                      <div key={idx} className="flex items-center gap-3 py-2 px-1">
                        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-surface-alt/20" style={{ backgroundColor: `${item.color}15` }}>
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
          </div>
        )}

        {/* Category Breakdown */}
        {tab === 'categories' && (
          <div className="space-y-3">
            <Card className="p-4 !rounded-xl">
              <div className="mb-4">
                <span className="text-sm font-semibold text-text">
                  Distribution Breakdown
                </span>
              </div>

              {categories.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-12 italic opacity-50">No data available</p>
              ) : (
                <div className="space-y-4">
                  {/* Visual Distribution Segment Bar */}
                  <div className="flex h-3 w-full rounded-full overflow-hidden bg-surface-alt/20 mb-4 border border-border/5">
                    {categories.map((cat, i) => {
                      const percentage = totalCategoryAmount ? (cat.amount / totalCategoryAmount) * 100 : 0;
                      return (
                        <div
                          key={`seg-${i}`}
                          style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                          className="h-full first:rounded-l-full last:rounded-r-full hover:opacity-80 transition-opacity"
                          title={`${cat.name}: ${percentage.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="divide-y divide-border/10">
                    {categories.map((cat) => {
                      const IconComp = getIcon(cat.icon);
                      const percentage = totalCategoryAmount ? ((cat.amount / totalCategoryAmount) * 100).toFixed(1) : 0;
                      return (
                        <div key={cat.categoryId} className="flex items-center gap-3 py-2 group">
                          <div
                            className="w-8 h-8 rounded-[10px] flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${cat.color}15` }}
                          >
                            <IconComp className="w-4 h-4" style={{ color: cat.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[13px] font-bold text-text tracking-tight truncate">{cat.name}</span>
                              <span className="text-[13px] font-black text-text tabular-nums">
                                ₹{cat.amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-surface-alt/30 rounded-full h-[3px] overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-1000"
                                  style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                                />
                              </div>
                              <span className="text-[9px] font-bold tabular-nums text-text-muted opacity-60 w-8 text-right flex-shrink-0">
                                {percentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
