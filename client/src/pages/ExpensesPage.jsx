import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { expenseService } from '../services/expense.service';
import { categoryService } from '../services/category.service';
import FilterChips from '../components/ui/FilterChips';
import EmptyState from '../components/ui/EmptyState';
import SwipeableRow from '../components/ui/SwipeableRow';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { getIcon } from '../components/ui/CategoryGrid';
import { useDebounce } from '../hooks/useDebounce';
import { format } from 'date-fns';

function isToday(date) {
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

function isYesterday(date) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === yesterday.getDate();
}

export default function ExpensesPage() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    categoryService.list('expense').then((res) => setCategories(res.categories)).catch(() => { });
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [selectedCategory, debouncedSearch]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.categoryId = selectedCategory;
      if (debouncedSearch) params.search = debouncedSearch;
      const result = await expenseService.list(params);
      setExpenses(result.items);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await expenseService.delete(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success('Expense deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const categoryFilters = [
    { value: 'all', label: 'All' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  // Group by date
  const grouped = {};
  expenses.forEach((expense) => {
    const d = new Date(expense.date);
    const dateKey = format(d, 'yyyy-MM-dd');
    const label = isToday(d) ? 'TODAY' :
      isYesterday(d) ? 'YESTERDAY' :
        format(d, 'MMM d, yyyy').toUpperCase();
    if (!grouped[dateKey]) grouped[dateKey] = { label, items: [] };
    grouped[dateKey].items.push(expense);
  });

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in bg-bg">
      {/* Header */}
      <div className="flex-shrink-0 bg-bg pt-4 px-5 pb-3 border-b border-border/10 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full active:bg-surface-alt transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text" />
            </button>
            <h1 className="text-[28px] font-black text-text tracking-tight">
              Expenses<span className="text-primary">.</span>
            </h1>
          </div>
          <button
            onClick={() => navigate('/add-expense')}
            className="p-2 -mr-2 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 text-text" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expenses..."
            className="w-full pl-11 pr-4 py-2.5 bg-surface-alt border border-transparent rounded-2xl text-sm text-text placeholder:text-text-muted focus:border-border focus:bg-surface transition-all shadow-inner"
            id="expense-search"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 mb-1">
          {categoryFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedCategory(filter.value)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${selectedCategory === filter.value
                  ? 'bg-primary text-bg-dark shadow-md'
                  : 'bg-surface border border-surface-alt text-text-secondary hover:bg-surface-alt'
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-32">
        {loading ? (
          [...Array(6)].map((_, i) => <CardSkeleton key={i} />)
        ) : expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Start tracking by adding your first expense"
          />
        ) : (
          Object.entries(grouped).map(([dateKey, group]) => (
            <div key={dateKey} className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[9px] uppercase tracking-widest font-black text-text-secondary opacity-40">
                  {group.label}
                </span>
                <div className="h-[0.5px] bg-border/20 flex-1"></div>
              </div>

              <div className="">
                {group.items.map((expense) => {
                  const IconComp = getIcon(expense.category?.icon);
                  return (
                    <SwipeableRow
                      key={expense.id}
                      onDelete={() => handleDelete(expense.id)}
                      onEdit={() => navigate(`/add-expense?edit=${expense.id}`)}
                    >
                      <div className="flex items-center gap-3 py-2.5 transition-colors bg-bg border-b border-border/5 last:border-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: `${expense.category?.color}15` }}
                        >
                          <IconComp className="w-4.5 h-4.5 transition-transform group-hover:scale-110" style={{ color: expense.category?.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text truncate tracking-tight opacity-90">{expense.category?.name}</p>
                          <p className="text-[10px] font-medium text-text-muted opacity-40 mt-0.5 truncate">
                            {expense.notes || `${format(new Date(expense.date), 'MMM d')} · ${format(new Date(expense.date), 'h:mm a')}`}
                          </p>
                        </div>
                        <p className="text-[14px] font-medium tabular-nums text-text flex-shrink-0">
                          -₹{expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </SwipeableRow>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
