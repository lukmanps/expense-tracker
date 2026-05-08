import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { incomeService } from '../services/income.service';
import Button from '../components/ui/Button';
import AmountDisplay from '../components/ui/AmountDisplay';
import FilterChips from '../components/ui/FilterChips';
import { format } from 'date-fns';

const sourceOptions = [
  { value: 'Salary', label: 'Salary' },
  { value: 'Freelance', label: 'Freelance' },
  { value: 'Gift', label: 'Gift' },
  { value: 'Investment', label: 'Investment' },
  { value: 'Other', label: 'Other' },
];

export default function AddIncomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [amount, setAmount] = useState('0');
  const [source, setSource] = useState('Salary');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editId) {
      incomeService.getById(editId).then((res) => {
        const i = res.income;
        setAmount(String(i.amount));
        setSource(i.source);
        setDate(format(new Date(i.date), 'yyyy-MM-dd'));
        setNotes(i.notes || '');
      });
    }
  }, [editId]);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const data = {
        amount: numAmount,
        source,
        date: new Date(date).toISOString(),
        notes: notes || null,
      };

      if (editId) {
        await incomeService.update(editId, data);
        toast.success('Income updated');
      } else {
        await incomeService.create(data);
        toast.success('Income added');
      }
      navigate(-1);
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-text-secondary p-2 -ml-2">
          <ChevronLeft className="w-6 h-6" />
          <span className="text-sm font-bold">Cancel</span>
        </button>
        <h1 className="text-2xl font-black text-text tracking-tight">{editId ? 'Edit Income' : 'Add Income'}</h1>
        <div className="w-[88px]" />
      </div>

      {/* Amount Input */}
      <div className="text-center py-8 px-5 mb-2">
        <p className="text-sm text-text-muted mb-2">Enter amount</p>
        <div className="flex items-center justify-center text-[40px] font-bold text-text">
          <span className="mr-1 text-text-muted">₹</span>
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

      {/* Source */}
      <div className="px-5 pb-4">
        <h3 className="text-sm font-medium text-text mb-2">Source</h3>
        <FilterChips options={sourceOptions} selected={source} onSelect={setSource} />
      </div>

      {/* Date */}
      <div className="px-5 pb-3">
        <div className="flex items-center p-3.5 bg-surface-alt rounded-xl gap-3">
          <span className="text-sm text-text-muted">📅</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-sm text-text flex-1"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="px-5 pb-3">
        <h3 className="text-sm font-medium text-text mb-2">Notes</h3>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add a note..."
          className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-sm text-text placeholder:text-text-muted focus:border-primary transition-all"
        />
      </div>

      {/* Submit */}
      <div className="mt-auto px-5 pb-22 pt-6">
        <Button onClick={handleSubmit} size="full" loading={loading}>
          {editId ? 'Update Income' : 'Save Income'}
        </Button>
      </div>
    </div>
  );
}
