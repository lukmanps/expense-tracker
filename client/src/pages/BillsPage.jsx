import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { transactionService } from '../services/transaction.service';
import { getIcon } from '../components/ui/CategoryGrid';
import EmptyState from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/SkeletonLoader';
import { format } from 'date-fns';

export default function BillsPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('to_pay');

  // Confirmation dialog state
  const [confirmBill, setConfirmBill] = useState(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const res = await transactionService.list({ limit: 100 });
      setTransactions(res.items);
    } catch {
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await transactionService.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success('Bill deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleComplete = async () => {
    if (!confirmBill) return;
    setCompleting(true);
    try {
      const { transaction } = await transactionService.complete(confirmBill.id);
      setTransactions((prev) => prev.map((t) => (t.id === confirmBill.id ? transaction : t)));
      const action = confirmBill.type === 'to_pay' ? 'Expense' : 'Income';
      toast.success(`Bill completed! Added as ${action}.`);
      setConfirmBill(null);
    } catch (err) {
      toast.error(err.message || 'Failed to complete bill');
    } finally {
      setCompleting(false);
    }
  };

  // Filtering & sorting
  const filtered = transactions.filter((t) => t.type === tab);
  const pending = filtered.filter((t) => t.status === 'pending');
  const completed = filtered.filter((t) => t.status === 'completed');

  const tabs = [
    { value: 'to_pay', label: 'to pay' },
    { value: 'to_receive', label: 'to receive' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden animate-fade-in bg-bg">
      {/* Header */}
      <div className="flex-shrink-0 bg-bg pt-4 px-5 pb-1">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[28px] font-black text-text tracking-tight">
            Bills<span className="text-primary">.</span>
          </h1>
          <button
            onClick={() => navigate('/add-bill')}
            className="p-2 -mr-2 active:scale-95 transition-transform"
          >
            <Plus className="w-6 h-6 text-text" />
          </button>
        </div>

        {/* Scrollable pill filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all uppercase tracking-widest ${
                tab === t.value
                  ? 'bg-primary text-bg-dark shadow-lg shadow-primary/10'
                  : 'bg-surface-alt/50 text-text-muted opacity-60 hover:opacity-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="flex-shrink-0 px-5 pt-3 pb-3 bg-bg">
        <div className="flex items-center justify-between px-2 text-[11px] font-bold uppercase tracking-wider">
          <span className="text-text-muted opacity-60">
            {pending.length} pending
          </span>
          <span className={`tabular-nums ${tab === 'to_receive' ? 'text-success' : 'text-danger'}`}>
            {tab === 'to_receive' ? '+' : '-'}₹
            {pending.reduce((s, t) => s + t.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Bill List - Scrollable */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {loading ? (
          [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
        ) : pending.length === 0 && completed.length === 0 ? (
          <div className="pt-12">
            <EmptyState
              title="No bills yet"
              description={`Add a bill to track money you ${tab === 'to_receive' ? 'need to collect' : 'need to pay'}`}
            />
          </div>
        ) : (
          <div className="space-y-1">
            {/* Pending bills */}
            <div className="divide-y divide-border/20">
              {pending.map((item) => {
                const IconComp = item.category ? getIcon(item.category.icon) : null;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(`/add-bill?edit=${item.id}`)}
                    className="flex items-center gap-4 py-4 w-full text-left group active:bg-surface-alt/10 transition-colors rounded-2xl px-2 -mx-2"
                  >
                    {/* Tap to complete */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmBill(item);
                      }}
                      className="flex-shrink-0 active:scale-90 transition-transform p-1 cursor-pointer"
                    >
                      <Circle className="w-6 h-6 text-text-muted opacity-40 hover:text-primary hover:opacity-100 transition-all" />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      {IconComp && (
                        <div
                          className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 shadow-inner group-active:scale-95 transition-transform"
                          style={{ backgroundColor: `${item.category.color}15` }}
                        >
                          <IconComp className="w-6 h-6" style={{ color: item.category.color }} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text truncate tracking-tight">{item.name}</p>
                        <p className="text-[11px] font-medium text-text-muted opacity-60 mt-0.5">
                          {item.category?.name ? `${item.category.name} · ` : ''}
                          {item.dueDate ? `Due ${format(new Date(item.dueDate), 'MMM d')}` : 'No due date'}
                        </p>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <p className={`text-[15px] font-black tabular-nums ${
                        tab === 'to_receive' ? 'text-success' : 'text-text'
                       }`}>
                        {tab === 'to_receive' ? '+' : '-'}₹{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Completed bills */}
            {completed.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-3 pt-4 pb-4">
                  <span className="text-[10px] uppercase tracking-widest font-black text-text-secondary opacity-40">
                    Completed
                  </span>
                  <div className="h-px bg-border/15 flex-1" />
                </div>
                <div className="divide-y divide-border/10 space-y-1">
                  {completed.map((item) => {
                    const IconComp = item.category ? getIcon(item.category.icon) : null;
                    return (
                      <div key={item.id} className="flex items-center gap-4 py-3.5 opacity-40 grayscale-[0.5] px-2 -mx-2">
                        <CheckCircle2 className="w-6 h-6 text-success flex-shrink-0" />
                        {IconComp && (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-surface-alt/50"
                          >
                            <IconComp className="w-5 h-5" style={{ color: 'gray' }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-muted line-through truncate tracking-tight">{item.name}</p>
                          <p className="text-[10px] font-semibold text-text-muted opacity-60">
                            {item.type === 'to_pay' ? 'Expense record created' : 'Income record created'}
                          </p>
                        </div>
                        <p className="text-sm font-black text-text-muted flex-shrink-0 tabular-nums">
                          ₹{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-[340px] bg-surface border border-white/5 rounded-[32px] p-6 space-y-6 shadow-2xl">
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-[28px] bg-primary/10 flex items-center justify-center shadow-inner">
                <AlertTriangle className="w-10 h-10 text-primary" />
              </div>
            </div>

            <div className="text-center space-y-3">
              <h3 className="text-xl font-bold text-text tracking-tight">Complete bill?</h3>
              <p className="text-sm text-text-secondary leading-relaxed px-2 opacity-80 font-medium">
                Mark <span className="text-text font-bold">{confirmBill.name}</span> as done? This will create a{' '}
                <span className={`font-bold ${confirmBill.type === 'to_pay' ? 'text-danger' : 'text-success'}`}>
                  {confirmBill.type === 'to_pay' ? 'new expense' : 'income entry'}
                </span> for ₹{confirmBill.amount.toLocaleString()}.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setConfirmBill(null)}
                className="flex-1 py-4 rounded-2xl bg-surface-alt text-text-secondary font-bold text-sm active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 py-4 rounded-2xl bg-primary text-bg-dark font-black text-sm active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {completing ? '...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
