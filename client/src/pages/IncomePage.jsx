import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { incomeService } from '../services/income.service';
import Card from '../components/ui/Card';
import FilterChips from '../components/ui/FilterChips';
import EmptyState from '../components/ui/EmptyState';
import SwipeableRow from '../components/ui/SwipeableRow';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { useDebounce } from '../hooks/useDebounce';
import { format } from 'date-fns';
import { Banknote, Laptop, Gift, TrendingUp, PlusCircle } from 'lucide-react';

const sourceIcons = {
  'Salary': Banknote,
  'Freelance': Laptop,
  'Gift': Gift,
  'Investment': TrendingUp,
};

const sourceFilters = [
  { value: 'all', label: 'All' },
  { value: 'Salary', label: 'Salary' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Investment', label: 'Investment' },
];

export default function IncomePage() {
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState([]);
  const [selectedSource, setSelectedSource] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    loadIncomes();
  }, [selectedSource, debouncedSearch]);

  const loadIncomes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedSource !== 'all') params.source = selectedSource;
      if (debouncedSearch) params.search = debouncedSearch;
      const result = await incomeService.list(params);
      setIncomes(result.items);
    } catch {
      toast.error('Failed to load incomes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await incomeService.delete(id);
      setIncomes((prev) => prev.filter((i) => i.id !== id));
      toast.success('Income deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="sticky top-0 z-40 bg-bg/80 backdrop-blur-lg px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-3xl font-black text-text tracking-tight">Income</h1>
          <button
            onClick={() => navigate('/add-income')}
            className="p-2 -mr-2 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 text-text" />
          </button>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search income..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-alt border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:border-primary transition-all"
          />
        </div>

        <FilterChips options={sourceFilters} selected={selectedSource} onSelect={setSelectedSource} />
      </div>

      <div className="px-5 pt-3 space-y-2">
        {loading ? (
          [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
        ) : incomes.length === 0 ? (
          <EmptyState title="No income recorded" description="Add your first income entry" />
        ) : (
          incomes.map((income) => {
            const SourceIcon = sourceIcons[income.source] || PlusCircle;
            return (
              <SwipeableRow
                key={income.id}
                onDelete={() => handleDelete(income.id)}
                onEdit={() => navigate(`/add-income?edit=${income.id}`)}
              >
                <div className="py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-success/10 flex-shrink-0">
                      <SourceIcon className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">{income.source}</p>
                      <p className="text-xs text-text-muted truncate">
                        {income.notes || format(new Date(income.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-success flex-shrink-0">
                      +${income.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </SwipeableRow>
            );
          })
        )}
      </div>
    </div>
  );
}
