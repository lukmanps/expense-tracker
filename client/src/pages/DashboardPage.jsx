import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Send, MoreHorizontal, Bell, ChevronRight, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../store/useAuthStore';
import { statsService } from '../services/stats.service';
import Card from '../components/ui/Card';
import AmountDisplay from '../components/ui/AmountDisplay';
import FilterChips from '../components/ui/FilterChips';
import { DashboardSkeleton } from '../components/ui/SkeletonLoader';
import { getIcon } from '../components/ui/CategoryGrid';
import { format } from 'date-fns';

const activityFilters = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryData, activityData] = await Promise.all([
        statsService.dashboard(),
        statsService.recentActivity(15),
      ]);
      setSummary(summaryData);
      setRecentActivity(activityData.data);
    } catch (err) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  const filteredActivity = filter === 'all'
    ? recentActivity
    : recentActivity.filter((a) => a.type === filter);

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in bg-bg">
      {/* Top Fixed Section: Header, Balance, Summary */}
      <div className="flex-shrink-0">
        <div 
          className="relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(180deg, rgba(204, 237, 133, 0.35) 0%, rgba(204, 237, 133, 0.1) 50%, transparent 100%)',
          }}
        >
          {/* Subtle texture/overlay */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          
          {/* Header */}
          <div className="px-5 py-5 flex items-center justify-between relative z-10">
            <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center border border-border/20">
              <span className="text-sm font-bold text-text">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <h1 className="text-base font-bold text-text tracking-tight">Main Account</h1>
            <button className="relative w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center border border-border/20">
              <Bell className="w-5 h-5 text-text-secondary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full border border-bg" />
            </button>
          </div>

          {/* Balance */}
          <div className="text-center pt-2 pb-5 px-5 relative z-10">
            <p className="text-[11px] font-bold text-text-muted mb-0.5 uppercase tracking-widest opacity-60">Your Balance</p>
            <div className="text-text">
              <AmountDisplay amount={summary?.balance || 0} size="xl" />
            </div>
            {summary?.balance > 0 && (
              <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 bg-primary/10 backdrop-blur-md rounded-full border border-white/5">
                <TrendingUp className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-bold text-text">
                  You saved ${Math.abs(summary?.balance || 0).toLocaleString()} this month
                </span>
              </div>
            )}
          </div>

          {/* Integrated Summary Section */}
          <div className="px-8 pb-8 relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ArrowUpRight className="w-8 h-8 text-danger/80" />
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider opacity-60">Expenses</p>
                  <p className="text-base font-black text-text">
                    -${(summary?.totalExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider opacity-60">Income</p>
                  <p className="text-base font-black text-text">
                    +${(summary?.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <ArrowDownLeft className="w-8 h-8 text-success/80" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Separator */}
      <div className="h-2 bg-surface-alt/30 border-y border-border/10 flex-shrink-0" />

      {/* Scrollable Transaction History Section */}
      <div className="flex-1 overflow-hidden flex flex-col bg-bg rounded-t-[40px] border-t border-x border-border/10 shadow-[0_-12px_40px_rgba(0,0,0,0.1)] -mt-6 relative z-20 pt-8">
        <div className="px-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text opacity-90">Transaction History</h2>
            <button
              onClick={() => navigate('/expenses')}
              className="text-xs font-bold text-text-muted hover:text-text flex items-center gap-0.5 transition-colors active:scale-95"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <FilterChips options={activityFilters} selected={filter} onSelect={setFilter} className="mb-4" />
        </div>

        {/* The Actual Scrollable List */}
        <div className="flex-1 overflow-y-auto px-5 pb-36">
          {filteredActivity.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm italic font-medium opacity-50">No transactions recorded yet</div>
          ) : (
            <div className="divide-y divide-border/20">
              {filteredActivity.map((item) => {
                const IconComp = getIcon(item.icon);
                return (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 group active:bg-surface-alt/15 transition-colors rounded-xl px-1 -mx-1">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <IconComp className="w-4.5 h-4.5 transition-transform group-hover:scale-110" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-text truncate tracking-tight opacity-90">{item.title}</p>
                      <p className="text-[10px] font-medium text-text-muted opacity-50 mt-0.5">
                        {format(new Date(item.date), 'MMM d')} · {format(new Date(item.date), 'h:mm a')}
                      </p>
                    </div>
                    <p className={`text-[14px] font-medium flex-shrink-0 tabular-nums ${
                      item.amount >= 0 ? 'text-success' : 'text-text'
                    }`}>
                      {item.amount >= 0 ? '+' : '-'}${Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
