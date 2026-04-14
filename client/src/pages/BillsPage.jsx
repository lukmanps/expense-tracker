import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckCircle2, Circle, Pencil, Trash2, AlertTriangle } from 'lucide-react';
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
    { value: 'to_pay', label: 'To Pay' },
    { value: 'to_receive', label: 'To Receive' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-bg pt-4 px-5 pb-3">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-text">Bills</h1>
          <button
            onClick={() => navigate('/add-bill')}
            className="w-11 h-11 rounded-full bg-primary flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5 text-bg-dark" />
          </button>
        </div>

        {/* Segmented Tabs */}
        <div className="flex bg-surface-alt rounded-2xl p-1">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
                tab === t.value
                  ? 'bg-primary text-bg-dark shadow-sm'
                  : 'text-text-secondary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">
            {pending.length} pending
          </span>
          <span className={`font-bold ${tab === 'to_receive' ? 'text-success' : 'text-danger'}`}>
            {tab === 'to_receive' ? '+' : '-'}$
            {pending.reduce((s, t) => s + t.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Bill List */}
      <div className="px-5 pb-8">
        {loading ? (
          [...Array(4)].map((_, i) => <CardSkeleton key={i} />)
        ) : pending.length === 0 && completed.length === 0 ? (
          <EmptyState
            title="No bills yet"
            description={`Add a bill to track money you ${tab === 'to_receive' ? 'need to collect' : 'need to pay'}`}
          />
        ) : (
          <>
            {/* Pending bills */}
            <div className="divide-y divide-border/40">
              {pending.map((item) => {
                const IconComp = item.category ? getIcon(item.category.icon) : null;
                return (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    {/* Tap to complete */}
                    <button
                      onClick={() => setConfirmBill(item)}
                      className="flex-shrink-0 active:scale-90 transition-transform"
                    >
                      <Circle className="w-5 h-5 text-text-muted" />
                    </button>

                    {/* Icon */}
                    {IconComp && (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.category.color}20` }}
                      >
                        <IconComp className="w-5 h-5" style={{ color: item.category.color }} />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text truncate">{item.name}</p>
                      <p className="text-[11px] text-text-muted">
                        {item.category?.name ? `${item.category.name} · ` : ''}
                        {item.dueDate ? `Due ${format(new Date(item.dueDate), 'MMM d')}` : 'No due date'}
                      </p>
                    </div>

                    {/* Amount */}
                    <p className={`text-sm font-bold flex-shrink-0 ${
                      tab === 'to_receive' ? 'text-success' : 'text-danger'
                    }`}>
                      {tab === 'to_receive' ? '+' : '-'}${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>

                    {/* Edit */}
                    <button
                      onClick={() => navigate(`/add-bill?edit=${item.id}`)}
                      className="w-7 h-7 flex items-center justify-center text-text-muted active:text-text"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="w-7 h-7 flex items-center justify-center text-text-muted active:text-danger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Completed bills */}
            {completed.length > 0 && (
              <>
                <div className="flex items-center gap-3 pt-4 pb-2">
                  <span className="text-[10px] uppercase tracking-wide font-bold text-text-secondary">
                    Completed
                  </span>
                  <div className="h-px bg-surface-alt flex-1" />
                </div>
                <div className="divide-y divide-border/40">
                  {completed.map((item) => {
                    const IconComp = item.category ? getIcon(item.category.icon) : null;
                    return (
                      <div key={item.id} className="flex items-center gap-3 py-3 opacity-50">
                        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                        {IconComp && (
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${item.category.color}20` }}
                          >
                            <IconComp className="w-5 h-5" style={{ color: item.category.color }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-muted line-through truncate">{item.name}</p>
                          <p className="text-[11px] text-text-muted">
                            {item.type === 'to_pay' ? 'Added as expense' : 'Added as income'}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-text-muted flex-shrink-0">
                          ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      {confirmBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-surface rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-primary-dark" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-text">Complete this bill?</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                <span className="font-semibold text-text">{confirmBill.name}</span> for{' '}
                <span className="font-semibold text-text">
                  ${confirmBill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>{' '}
                will be marked as done and automatically added as{' '}
                <span className={`font-semibold ${confirmBill.type === 'to_pay' ? 'text-danger' : 'text-success'}`}>
                  {confirmBill.type === 'to_pay' ? 'an expense' : 'income'}
                </span>.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmBill(null)}
                className="flex-1 py-3 rounded-2xl bg-surface-alt text-text font-medium text-sm active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                disabled={completing}
                className="flex-1 py-3 rounded-2xl bg-primary text-bg-dark font-semibold text-sm active:scale-95 transition-transform disabled:opacity-50"
              >
                {completing ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
