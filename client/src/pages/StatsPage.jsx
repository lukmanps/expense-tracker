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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/80 backdrop-blur-lg px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold text-text mb-3">Statistics</h1>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="p-3 text-center">
            <p className="text-[10px] text-text-muted uppercase font-medium">Income</p>
            <p className="text-sm font-bold text-success mt-0.5">
              ${(summary?.totalIncome || 0).toLocaleString()}
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-text-muted uppercase font-medium">Expenses</p>
            <p className="text-sm font-bold text-danger mt-0.5">
              ${(summary?.totalExpense || 0).toLocaleString()}
            </p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-[10px] text-text-muted uppercase font-medium">Balance</p>
            <p className="text-sm font-bold text-text mt-0.5">
              ${(summary?.balance || 0).toLocaleString()}
            </p>
          </Card>
        </div>

        <FilterChips options={tabs} selected={tab} onSelect={setTab} />
      </div>

      <div className="px-5 pt-4">
        {/* Weekly Chart */}
        {tab === 'weekly' && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-text mb-4">Weekly Spending</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weekly} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="amount" fill="#C8E972" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Monthly Chart */}
        {tab === 'monthly' && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-text mb-4">Monthly Summary</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-xs text-text-muted">Income</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-danger" />
                <span className="text-xs text-text-muted">Expenses</span>
              </div>
            </div>
          </Card>
        )}

        {/* Category Breakdown */}
        {tab === 'categories' && (
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-text mb-4">Category Breakdown</h3>
              {categories.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-8">No expenses this month</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {categories.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="space-y-3 mt-4">
                    {categories.map((cat) => {
                      const IconComp = getIcon(cat.icon);
                      const percentage = totalCategoryAmount ? ((cat.amount / totalCategoryAmount) * 100).toFixed(1) : 0;
                      return (
                        <div key={cat.categoryId} className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${cat.color}20` }}
                          >
                            <IconComp className="w-4 h-4" style={{ color: cat.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-text">{cat.name}</span>
                              <span className="text-sm font-semibold text-text">
                                ${cat.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="w-full bg-surface-alt rounded-full h-1.5 mt-1.5">
                              <div
                                className="h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                              />
                            </div>
                          </div>
                          <span className="text-xs text-text-muted flex-shrink-0 w-10 text-right">
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
