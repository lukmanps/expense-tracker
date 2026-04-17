import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
        <p className="text-white font-black text-sm">${payload[0].value?.toLocaleString()}</p>
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
      {/* Integrated Overview Section */}
      <div className="flex-shrink-0 bg-bg px-5 pt-4">
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-[32px] font-black text-text tracking-tight">
            Statistics<span className="text-primary">.</span>
          </h1>
        </div>

        {/* Unified Overview Card */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary/10 via-surface-alt/50 to-surface-alt/20 border border-border/10 p-6 mb-8">
           <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
           
           <div className="flex justify-around items-center relative z-10 py-1">
               <div className="flex flex-col items-center">
                 <span className="text-[10px] font-black text-success/60 uppercase tracking-[0.2em] mb-1">Income</span>
                 <span className="text-2xl font-black text-success tracking-tighter">${(summary?.totalIncome || 0).toLocaleString()}</span>
               </div>
               <div className="h-8 w-px bg-border/20 mx-4" />
               <div className="flex flex-col items-center">
                 <span className="text-[10px] font-black text-danger/60 uppercase tracking-[0.2em] mb-1">Expense</span>
                 <span className="text-2xl font-black text-danger tracking-tighter">${(summary?.totalExpense || 0).toLocaleString()}</span>
               </div>
           </div>
        </div>

        <FilterChips options={tabs} selected={tab} onSelect={setTab} />
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32">
        {/* Weekly/Monthly Chart View */}
        {(tab === 'weekly' || tab === 'monthly') && (
          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-8 px-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-text-secondary opacity-30">
                  {tab === 'weekly' ? 'Weekly Activity' : 'Monthly Growth'}
                </span>
                <div className="h-px bg-surface-alt flex-1" />
              </div>

              {tab === 'weekly' ? (
                <div className="bg-surface-alt/10 rounded-[40px] p-8 border border-border/5">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={weekly} barSize={36}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
                          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.1} />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} dy={15} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-surface-alt)', opacity: 0.2 }} />
                      <Bar dataKey="amount" fill="url(#barGradient)" radius={[12, 12, 12, 12]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="bg-surface-alt/10 rounded-[40px] p-8 border border-border/5">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={monthly}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.1} />
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} dy={15} />
                      <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)', fontWeight: 800 }} axisLine={false} tickLine={false} width={35} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                      <Area type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top 5 Expenses section */}
            <div>
              <div className="flex items-center gap-3 mb-6 px-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-text-secondary opacity-30">
                  Top 5 Expenses
                </span>
                <div className="h-px bg-surface-alt flex-1" />
              </div>
              <div className="space-y-1">
                {topExpenses.map((item, idx) => {
                  const IconComp = getIcon(item.icon);
                  return (
                    <div key={idx} className="flex items-center gap-4 py-3.5 px-2">
                       <div className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                         <IconComp className="w-5.5 h-5.5" style={{ color: item.color }} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-text truncate tracking-tight">{item.name || item.categoryName}</p>
                         <p className="text-[10px] font-black text-text-muted opacity-40 uppercase tracking-widest mt-0.5">
                           {item.categoryName}
                         </p>
                       </div>
                       <p className="text-[15px] font-black tabular-nums text-text">
                         -${item.amount.toLocaleString()}
                       </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {tab === 'categories' && (
          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-8 px-1">
                <span className="text-[10px] uppercase tracking-widest font-black text-text-secondary opacity-30">
                  Distribution Breakdown
                </span>
                <div className="h-px bg-surface-alt flex-1" />
              </div>

              {categories.length === 0 ? (
                <p className="text-center text-text-muted text-sm py-12 italic opacity-50">No data available</p>
              ) : (
                <div className="space-y-6">
                  {/* Visual Distribution Segment Bar */}
                  <div className="flex h-5 w-full rounded-full overflow-hidden shadow-inner bg-surface-alt/20 mb-8 border border-border/5">
                    {categories.map((cat, i) => {
                      const percentage = totalCategoryAmount ? (cat.amount / totalCategoryAmount) * 100 : 0;
                      return (
                        <div
                          key={`seg-${i}`}
                          style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                          className="h-full first:rounded-l-full last:rounded-r-full hover:scale-y-110 transition-transform cursor-pointer"
                          title={`${cat.name}: ${percentage.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    {categories.map((cat) => {
                      const IconComp = getIcon(cat.icon);
                      const percentage = totalCategoryAmount ? ((cat.amount / totalCategoryAmount) * 100).toFixed(1) : 0;
                      return (
                        <div key={cat.categoryId} className="flex items-center gap-4 py-3 px-3 transition-colors hover:bg-surface-alt/20 rounded-2xl group cursor-default">
                          <div
                            className="w-11 h-11 rounded-[16px] flex items-center justify-center flex-shrink-0 transition-transform group-hover:rotate-12"
                            style={{ backgroundColor: `${cat.color}15` }}
                          >
                            <IconComp className="w-5.5 h-5.5" style={{ color: cat.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-1">
                               <span className="text-sm font-black text-text tracking-tight uppercase tracking-[0.1em] text-[10px] opacity-40 group-hover:opacity-100 transition-opacity">{cat.name}</span>
                               <span className="text-[15px] font-black text-text tabular-nums tracking-tighter">
                                 ${cat.amount.toLocaleString()}
                               </span>
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-full bg-surface-alt/30 rounded-full h-1 overflow-hidden">
                                 <div
                                   className="h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,255,255,0.1)]"
                                   style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                                 />
                               </div>
                               <span className="text-[10px] font-black tabular-nums text-text-muted opacity-40 w-8 text-right">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
