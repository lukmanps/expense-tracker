import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { expenseService } from '../services/expense.service';
import { categoryService } from '../services/category.service';
import Button from '../components/ui/Button';
import CategoryGrid from '../components/ui/CategoryGrid';
import { format } from 'date-fns';

export default function AddExpensePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [amount, setAmount] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    categoryService.list('expense').then((res) => {
      setCategories(res.categories);
      if (res.categories.length > 0 && !categoryId) {
        setCategoryId(res.categories[0].id);
      }
    });

    if (editId) {
      expenseService.getById(editId).then((res) => {
        const e = res.expense;
        setAmount(String(e.amount));
        setCategoryId(e.categoryId);
        setDate(format(new Date(e.date), 'yyyy-MM-dd'));
        setNotes(e.notes || '');
      });
    }
  }, [editId]);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!categoryId) {
      toast.error('Select a category');
      return;
    }

    setLoading(true);
    try {
      const data = {
        amount: numAmount,
        categoryId,
        date: new Date(date).toISOString(),
        notes: notes || null,
      };

      if (editId) {
        await expenseService.update(editId, data);
        toast.success('Expense updated');
      } else {
        await expenseService.create(data);
        toast.success('Expense added');
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-secondary">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm">Cancel</span>
        </button>
        <h1 className="text-base font-semibold text-text">{editId ? 'Edit Expense' : 'Add Expense'}</h1>
        <div className="w-16" />
      </div>

      {/* Amount Input */}
      <div className="text-center py-8 px-5">
        <p className="text-sm text-text-muted mb-2">Enter amount</p>
        <div className="flex items-center justify-center text-[40px] font-bold text-text">
          <span className="mr-1 text-text-muted">$</span>
          <input
            type="number"
            autoFocus
            value={amount === '0' ? '' : amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="bg-transparent outline-none w-[200px] text-center placeholder:text-surface-alt"
          />
        </div>
      </div>

      {/* Category Grid */}
      <div className="px-5 pb-4">
        <CategoryGrid
          categories={categories}
          selected={categoryId}
          onSelect={setCategoryId}
          columns={5}
        />
      </div>

      {/* Date */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between p-3.5 bg-surface-alt rounded-xl">
          <span className="text-sm font-medium text-text">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm text-text-secondary text-right"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="px-5 pb-4">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (Optional)"
          rows={2}
          className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm text-text placeholder:text-text-muted resize-none focus:border-primary transition-all"
        />
      </div>

      {/* Submit */}
      <div className="mt-auto px-5 pb-6 pt-6">
        <Button onClick={handleSubmit} size="full" loading={loading}>
          {editId ? 'Update Expense' : 'Add Expense'}
        </Button>
      </div>
    </div>
  );
}
