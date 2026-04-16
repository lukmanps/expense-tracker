import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { transactionService } from '../services/transaction.service';
import { categoryService } from '../services/category.service';
import Button from '../components/ui/Button';
import CategoryGrid from '../components/ui/CategoryGrid';
import { format } from 'date-fns';

export default function AddBillPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const defaultType = searchParams.get('type') || 'to_pay';

  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('0');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load categories based on type
    const catType = type === 'to_pay' ? 'expense' : 'income';
    categoryService.list(catType).then((res) => {
      setCategories(res.categories);
      if (res.categories.length > 0 && !categoryId) {
        setCategoryId(res.categories[0].id);
      }
    });
  }, [type]);

  useEffect(() => {
    if (editId) {
      transactionService.getById(editId).then((res) => {
        const t = res.transaction;
        setType(t.type);
        setAmount(String(t.amount));
        setName(t.name);
        setCategoryId(t.categoryId || '');
        setDueDate(t.dueDate ? format(new Date(t.dueDate), 'yyyy-MM-dd') : '');
        setNotes(t.notes || '');
      });
    }
  }, [editId]);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!name.trim()) {
      toast.error('Enter a name');
      return;
    }

    setLoading(true);
    try {
      const data = {
        type,
        name: name.trim(),
        amount: numAmount,
        categoryId: categoryId || null,
        dueDate: dueDate || null,
        notes: notes || null,
      };

      if (editId) {
        await transactionService.update(editId, data);
        toast.success('Bill updated');
      } else {
        await transactionService.create(data);
        toast.success('Bill added');
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.message || 'Failed to save bill');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { value: 'to_pay', label: 'To Pay' },
    { value: 'to_receive', label: 'To Receive' },
  ];

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-secondary p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
          <span className="text-sm font-bold">Cancel</span>
        </button>
        <h1 className="text-2xl font-black text-text tracking-tight">{editId ? 'Edit Bill' : 'Add Bill'}</h1>
        <div className="w-[88px]" />
      </div>

      {/* Type Toggle */}
      {!editId && (
        <div className="px-5 pb-4">
          <div className="flex bg-surface-alt rounded-2xl p-1">
            {tabs.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setType(t.value);
                  setCategoryId('');
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  type === t.value
                    ? 'bg-primary text-bg-dark shadow-sm'
                    : 'text-text-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="text-center py-6 px-5">
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

      {/* Name */}
      <div className="px-5 pb-3">
        <div className="flex items-center p-3.5 bg-surface-alt rounded-xl">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bill name (e.g. Electricity, John Doe)"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted outline-none"
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

      {/* Due Date */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between p-3.5 bg-surface-alt rounded-xl">
          <span className="text-sm font-medium text-text">Due Date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
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
          {editId ? 'Update Bill' : 'Add Bill'}
        </Button>
      </div>
    </div>
  );
}
