import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
      <div className="bg-surface border border-border rounded-lg p-2 shadow-md text-xs">
        <p className="text-text-muted">{label}</p>
        <p className="text-text font-semibold">${payload[0].value?.toLocaleString()}</p>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [w, m, c, s] = await Promise.all([
        statsService.weekly(),
        statsService.monthly(),
        statsService.categoryBreakdown(),
        statsService.dashboard(),
      ]);
      setWeekly(w.data);
      setMonthly(m.data);
      setCategories(c.data);
      setSummary(s);
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
      {/* Header */}
      <div className="flex-shrink-0 bg-bg px-5 pt-4 pb-3 border-b border-border/10 shadow-sm">
        <h1 className="text-3xl font-black text-text tracking-tight mb-4">Statistics</h1>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Card className="p-3 text-center bg-surface-alt/50 border-none shadow-sm rounded-lg">
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider opacity-60">Income</p>
            <p className="text-sm font-black text-success mt-1">
              ${(summary?.totalIncome || 0).toLocaleString()}
            </p>
          </Card>
          <Card className="p-3 text-center bg-surface-alt/50 border-none shadow-sm rounded-lg">
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider opacity-60">Expenses</p>
            <p className="text-sm font-black text-danger mt-1">
              ${(summary?.totalExpense || 0).toLocaleString()}
            </p>
          </Card>
          <Card className="p-3 text-center bg-surface-alt/50 border-none shadow-sm rounded-lg">
            <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider opacity-60">Balance</p>
            <p className="text-sm font-black text-text mt-1">
              ${(summary?.balance || 0).toLocaleString()}
            </p>
          </Card>
        </div>

        <FilterChips options={tabs} selected={tab} onSelect={setTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
        {/* Weekly Chart */}
        {tab === 'weekly' && (
          <Card className="p-4 bg-surface border-white/5 shadow-xl rounded-lg">
            <h3 className="text-sm font-bold text-text mb-6 tracking-tight uppercase opacity-60">Weekly Spending</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekly} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-alt)', opacity: 0.4 }} />
                <Bar dataKey="amount" fill="#C8E972" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Monthly Chart */}
        {tab === 'monthly' && (
          <Card className="p-4 bg-surface border-white/5 shadow-xl rounded-lg">
            <h3 className="text-sm font-bold text-text mb-6 tracking-tight uppercase opacity-60">Monthly Summary</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={4} dot={{ r: 5, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={4} dot={{ r: 5, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-8 mt-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                <span className="text-[11px] font-bold text-text-muted tracking-wide">INCOME</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                <span className="text-[11px] font-bold text-text-muted tracking-wide">EXPENSES</span>
              </div>
            </div>
          </Card>
        )}

        {/* Category Breakdown */}
        {tab === 'categories' && (
          <div className="space-y-6">
            <Card className="p-4 bg-surface border-white/5 shadow-xl rounded-lg">
              <h3 className="text-sm font-bold text-text mb-4 tracking-tight uppercase opacity-60">Category Breakdown</h3>
              {categories.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-12 italic opacity-50">No expenses recorded this month</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={4}
                        strokeWidth={0}
                      >
                        {categories.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="space-y-4 mt-8">
                    {categories.map((cat) => {
                      const IconComp = getIcon(cat.icon);
                      const percentage = totalCategoryAmount ? ((cat.amount / totalCategoryAmount) * 100).toFixed(1) : 0;
                      return (
                        <div key={cat.categoryId} className="flex items-center gap-4 group">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
                            style={{ backgroundColor: `${cat.color}15` }}
                          >
                            <IconComp className="w-5 h-5" style={{ color: cat.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-sm font-bold text-text tracking-tight">{cat.name}</span>
                              <span className="text-sm font-black text-text tabular-nums">
                                ${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="w-full bg-surface-alt rounded-full h-2 overflow-hidden shadow-inner">
                              <div
                                className="h-full rounded-full transition-all duration-700 shadow-sm"
                                style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                              />
                            </div>
                          </div>
                          <span className="text-[11px] font-black tabular-nums text-text-muted flex-shrink-0 w-12 text-right opacity-60">
                            {percentage}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
