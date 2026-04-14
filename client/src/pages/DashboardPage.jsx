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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg/80 backdrop-blur-lg px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center">
            <span className="text-sm font-bold text-text">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <h1 className="text-base font-semibold text-text">Main Account</h1>
          <button className="relative w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-bg" />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <div className="px-5 pb-2">
        <div className="text-center py-6">
          <p className="text-sm text-text-secondary mb-1">Your Balance</p>
          <AmountDisplay amount={summary?.balance || 0} size="xl" className="text-text" />
          {summary?.balance > 0 && (
            <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-primary/20 rounded-full">
              <TrendingUp className="w-3.5 h-3.5 text-primary-dark" />
              <span className="text-xs font-medium text-primary-dark">
                You saved ${Math.abs(summary?.balance || 0).toLocaleString()} this month
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ArrowUpRight className="w-8 h-8 text-danger" />
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Expenses</p>
              <p className="text-lg font-bold text-white">
                -${(summary?.totalExpense || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ArrowDownLeft className="w-8 h-8 text-success" />
            <div>
              <p className="text-xs text-text-muted font-medium mb-0.5">Income</p>
              <p className="text-lg font-bold text-white">
                +${(summary?.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text">Transaction History</h2>
          <button
            onClick={() => navigate('/expenses')}
            className="text-sm text-text-secondary flex items-center gap-0.5"
          >
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <FilterChips options={activityFilters} selected={filter} onSelect={setFilter} className="mb-3" />

        {filteredActivity.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">No transactions yet</div>
        ) : (
          <div className="divide-y divide-border/40">
            {filteredActivity.map((item) => {
              const IconComp = getIcon(item.icon);
              return (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    <IconComp className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">{item.title}</p>
                    <p className="text-[11px] text-text-muted">
                      {format(new Date(item.date), 'MMM d')} · {format(new Date(item.date), 'h:mm a')}
                    </p>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${
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
  );
}
