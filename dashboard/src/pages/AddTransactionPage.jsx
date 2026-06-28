import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Table, Tag, DatePicker } from 'antd';
import * as Icons from 'lucide-react';
import {
  TrendingUp, TrendingDown, ArrowLeftRight, Plus, Loader2,
  X, Trash2, Pencil, CheckCircle2, Clock, Search
} from 'lucide-react';
import { adminService } from '../services/admin.service.js';
import useAdminStore, { ACCOUNT_COLORS } from '../store/useAdminStore.js';
import AmountDisplay, { formatINR } from '../components/ui/AmountDisplay.jsx';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Category Icons Mapping ──────────────────────────────────────────────────

const CATEGORY_ICONS = {
  'utensils': Icons.UtensilsCrossed,
  'car': Icons.Car,
  'shopping-bag': Icons.ShoppingBag,
  'home': Icons.Home,
  'receipt': Icons.Receipt,
  'film': Icons.Film,
  'heart': Icons.Heart,
  'book-open': Icons.BookOpen,
  'plane': Icons.Plane,
  'more-horizontal': Icons.MoreHorizontal,
  'banknote': Icons.Banknote,
  'laptop': Icons.Laptop,
  'gift': Icons.Gift,
  'trending-up': Icons.TrendingUp,
  'plus-circle': Icons.PlusCircle,
  'circle': Icons.Circle,
  'tag': Icons.Tag,
};

function CategoryIcon({ iconName, className, style }) {
  const IconComp = CATEGORY_ICONS[iconName] || Icons.Circle;
  return <IconComp className={className} style={style} size={14} />;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INCOME_SOURCES = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];
const TODAY = () => format(new Date(), 'yyyy-MM-dd');

const TABS = [
  { id: 'income', label: 'Income', icon: TrendingUp, color: 'text-emerald-600' },
  { id: 'expense', label: 'Expenses', icon: TrendingDown, color: 'text-destructive' },
  { id: 'transaction', label: 'Bills', icon: ArrowLeftRight, color: 'text-orange-500' },
];

// ─── Confirm Dialog ──────────────────────────────────────────────────────────

function ConfirmDialog({ open, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background rounded-2xl border shadow-2xl p-6 w-full max-w-sm mx-4">
        <p className="text-sm text-foreground font-medium mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            Delete
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Shared Form Primitives ───────────────────────────────────────────────────

function ModalShell({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-background rounded-2xl border shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function AmountField({ value, onChange }) {
  return (
    <div className="bg-muted/40 rounded-xl p-4 text-center border">
      <p className="text-xs text-muted-foreground mb-2 font-medium">Amount (₹)</p>
      <div className="flex items-center justify-center gap-1">
        <span className="text-3xl font-bold text-muted-foreground">₹</span>
        <input
          type="number"
          min="0"
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          autoFocus
          className="bg-transparent text-4xl font-bold text-foreground outline-none w-48 text-center placeholder:text-muted-foreground/40"
        />
      </div>
    </div>
  );
}

function DateField({ value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Date</label>
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function NotesField({ value, onChange }) {
  return (
    <div>
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Notes (optional)</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Add a note..."
        rows={2}
        className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
      />
    </div>
  );
}

function SubmitRow({ loading, label, onClose }) {
  return (
    <div className="flex gap-3 pt-2">
      <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={loading}>Cancel</Button>
      <Button type="submit" className="flex-1" disabled={loading}>
        {loading && <Loader2 size={14} className="animate-spin mr-2" />}
        {label}
      </Button>
    </div>
  );
}


// ─── Modals ─────────────────────────────────────────────────────────────

function IncomeModal({ userId, editItem, onClose, onSaved }) {
  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : '');
  const [source, setSource] = useState(editItem?.source || 'Salary');
  const [date, setDate] = useState(editItem ? format(new Date(editItem.date), 'yyyy-MM-dd') : TODAY());
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error('Enter a valid amount'); return; }
    setLoading(true);
    try {
      const data = { amount: num, source, date: new Date(date).toISOString(), notes: notes || null };
      if (editItem) {
        await adminService.updateIncome(userId, editItem.id, data);
        toast.success('Income updated');
      } else {
        await adminService.createIncome(userId, data);
        toast.success('Income added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title={editItem ? 'Edit Income' : 'Add Income'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AmountField value={amount} onChange={setAmount} />
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Source</label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-full h-10 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {INCOME_SOURCES.map(s => <SelectItem key={s} value={s} className="rounded-lg">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DateField value={date} onChange={setDate} />
        <NotesField value={notes} onChange={setNotes} />
        <SubmitRow loading={loading} label={editItem ? 'Update Income' : 'Save Income'} onClose={onClose} />
      </form>
    </ModalShell>
  );
}

function ExpenseModal({ userId, editItem, categories, onClose, onSaved }) {
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const [amount, setAmount] = useState(editItem ? String(Math.abs(editItem.amount)) : '');
  const [categoryId, setCategoryId] = useState(editItem?.categoryId || expenseCategories[0]?.id || '');
  const [date, setDate] = useState(editItem ? format(new Date(editItem.date), 'yyyy-MM-dd') : TODAY());
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [recurring, setRecurring] = useState(editItem?.recurring || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!editItem && expenseCategories.length > 0 && !categoryId) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, editItem, categoryId]);

  async function handleSubmit(e) {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error('Enter a valid amount'); return; }
    if (!categoryId) { toast.error('Create/select a category first'); return; }
    setLoading(true);
    try {
      const data = { amount: num, categoryId, date: new Date(date).toISOString(), notes: notes || null, recurring };
      if (editItem) {
        await adminService.updateExpense(userId, editItem.id, data);
        toast.success('Expense updated');
      } else {
        await adminService.createExpense(userId, data);
        toast.success('Expense added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title={editItem ? 'Edit Expense' : 'Add Expense'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <AmountField value={amount} onChange={setAmount} />

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Category</label>
          {expenseCategories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No expense categories found</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {expenseCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={`flex flex-col items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${categoryId === c.id
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50'
                    }`}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all" style={{ backgroundColor: categoryId === c.id ? c.color : `${c.color}15`, borderColor: categoryId === c.id ? c.color : `${c.color}40` }}>
                    <CategoryIcon iconName={c.icon} style={{ color: categoryId === c.id ? '#fff' : c.color }} className="w-4 h-4" />
                  </div>
                  <span className="truncate w-full text-center">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <DateField value={date} onChange={setDate} />
        <NotesField value={notes} onChange={setNotes} />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="w-4 h-4 rounded accent-primary"
          />
          <span className="text-sm font-medium text-foreground">Mark as recurring</span>
        </label>

        <SubmitRow loading={loading} label={editItem ? 'Update Expense' : 'Add Expense'} onClose={onClose} />
      </form>
    </ModalShell>
  );
}

function BillModal({ userId, editItem, categories, onClose, onSaved }) {
  const [name, setName] = useState(editItem?.name || '');
  const [amount, setAmount] = useState(editItem ? String(editItem.amount) : '');
  const [type, setType] = useState(editItem?.type || 'to_pay');
  const [dueDate, setDueDate] = useState(editItem?.dueDate ? format(new Date(editItem.dueDate), 'yyyy-MM-dd') : '');
  const [categoryId, setCategoryId] = useState(editItem?.categoryId || '');
  const [notes, setNotes] = useState(editItem?.notes || '');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) { toast.error('Enter a bill name'); return; }
    const num = parseFloat(amount);
    if (!num || num <= 0) { toast.error('Enter a valid amount'); return; }
    setLoading(true);
    try {
      const data = {
        name: name.trim(), amount: num, type,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        categoryId: categoryId || null,
        notes: notes || null,
      };
      if (editItem) {
        await adminService.updateTransaction(userId, editItem.id, data);
        toast.success('Bill updated');
      } else {
        await adminService.createTransaction(userId, data);
        toast.success('Bill added');
      }
      onSaved();
    } catch (err) {
      toast.error(err.message || 'Failed to save bill');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ModalShell title={editItem ? 'Edit Bill' : 'Add Bill'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Bill Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Electricity bill" />
        </div>

        <AmountField value={amount} onChange={setAmount} />

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Type</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: 'to_pay', label: '💸 To Pay', cls: 'text-destructive border-destructive/60 bg-destructive/10' },
              { v: 'to_receive', label: '💰 To Receive', cls: 'text-emerald-600 border-emerald-600/60 bg-emerald-600/10' },
            ].map(({ v, label, cls }) => (
              <button
                key={v} type="button"
                onClick={() => setType(v)}
                className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${type === v ? cls : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Due Date (optional)</label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category (optional)</label>
          <Select value={categoryId || 'none'} onValueChange={(v) => setCategoryId(v === 'none' ? '' : v)}>
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <NotesField value={notes} onChange={setNotes} />
        <SubmitRow loading={loading} label={editItem ? 'Update Bill' : 'Add Bill'} onClose={onClose} />
      </form>
    </ModalShell>
  );
}

// ─── Table Columns ────────────────────────────────────────────────────────────

function ActionButtons({ onEdit, onDelete, onComplete, item }) {
  return (
    <div className="flex items-center gap-1 justify-end">
      {onComplete && item.status === 'pending' && (
        <button
          onClick={() => onComplete(item.id)}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
          title="Mark complete"
        >
          <CheckCircle2 size={14} />
        </button>
      )}
      {(!item.status || item.status !== 'completed') && (
        <button
          onClick={() => onEdit(item)}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
      )}
      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        title="Delete"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}


// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AddTransactionPage() {
  const accounts = useAdminStore((s) => s.accounts);
  const selectedAccountId = useAdminStore((s) => s.selectedAccountId);
  const selectedIdx = accounts.findIndex((a) => a.id === selectedAccountId);
  const selectedAccount = selectedIdx >= 0 ? accounts[selectedIdx] : null;
  const selectedColor = selectedIdx >= 0 ? ACCOUNT_COLORS[selectedIdx % ACCOUNT_COLORS.length] : '#6366f1';

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab');
  const initialTab = (urlTab === 'income' || urlTab === 'expense' || urlTab === 'transaction') ? urlTab : 'income';

  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'income' || t === 'expense' || t === 'transaction') {
      setActiveTab(t);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearch('');
    setSearchParams((prev) => {
      prev.set('tab', tabId);
      return prev;
    });
  };

  // Data state
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [billData, setBillData] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);

  // Pagination State
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [billTotal, setBillTotal] = useState(0);
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [billPage, setBillPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const urlType = searchParams.get('type');
  const initialFilterType = (urlType === 'to_pay' || urlType === 'to_receive') ? urlType : 'all';
  const [filterType, setFilterType] = useState(initialFilterType);

  useEffect(() => {
    const t = searchParams.get('type');
    if (t === 'to_pay' || t === 'to_receive') {
      setFilterType(t);
    } else {
      setFilterType('all');
    }
  }, [searchParams]);

  const handleFilterTypeChange = (val) => {
    setFilterType(val);
    resetPagination();
    setSearchParams((prev) => {
      if (val === 'all') {
        prev.delete('type');
      } else {
        prev.set('type', val);
      }
      return prev;
    });
  };
  const [dateRange, setDateRange] = useState(null);

  // Modal state
  const [modal, setModal] = useState(null); // { type: 'income'|'expense'|'transaction', item?: obj }
  const [confirm, setConfirm] = useState(null); // { type, id }
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!selectedAccountId) return;
    adminService.userCategories(selectedAccountId)
      .then((r) => setCategories(r.categories || []))
      .catch(() => { });
  }, [selectedAccountId]);

  useEffect(() => {
    if (!selectedAccountId) return;
    loadTabData();
  }, [selectedAccountId, activeTab, incomePage, expensePage, billPage, search, filterCategory, filterSource, filterType, dateRange, pageSize]);

  async function loadTabData() {
    setLoading(true);
    try {
      const startDate = dateRange?.[0] ? dateRange[0].toISOString() : undefined;
      const endDate = dateRange?.[1] ? dateRange[1].toISOString() : undefined;

      if (activeTab === 'income') {
        const r = await adminService.userIncomes(selectedAccountId, {
          page: incomePage, limit: pageSize, search,
          source: filterSource === 'all' ? undefined : filterSource, startDate, endDate
        });
        setIncomeData(r.items || []);
        setIncomeTotal(r.total || 0);
      } else if (activeTab === 'expense') {
        const r = await adminService.userExpenses(selectedAccountId, {
          page: expensePage, limit: pageSize, search,
          categoryId: filterCategory === 'all' ? undefined : filterCategory, startDate, endDate
        });
        setExpenseData(r.items || []);
        setExpenseTotal(r.total || 0);
      } else {
        const r = await adminService.userTransactions(selectedAccountId, {
          page: billPage, limit: pageSize, search,
          type: filterType === 'all' ? undefined : filterType, startDate, endDate
        });
        setBillData(r.items || []);
        setBillTotal(r.total || 0);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function resetPagination() {
    if (activeTab === 'income') setIncomePage(1);
    else if (activeTab === 'expense') setExpensePage(1);
    else setBillPage(1);
  }

  function handleSaved() {
    setModal(null);
    loadTabData();
  }

  async function handleDelete() {
    if (!confirm) return;
    setDeleting(true);
    try {
      if (confirm.type === 'income') {
        await adminService.deleteIncome(selectedAccountId, confirm.id);
        toast.success('Income deleted');
      } else if (confirm.type === 'expense') {
        await adminService.deleteExpense(selectedAccountId, confirm.id);
        toast.success('Expense deleted');
      } else {
        await adminService.deleteTransaction(selectedAccountId, confirm.id);
        toast.success('Bill deleted');
      }
      loadTabData();
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
      setConfirm(null);
    }
  }

  async function handleComplete(id) {
    try {
      await adminService.completeTransaction(selectedAccountId, id);
      toast.success('Bill marked as completed');
      loadTabData();
    } catch (err) {
      toast.error(err.message || 'Failed');
    }
  }

  // Column definitions
  const incomeColumns = [
    {
      title: 'Date', dataIndex: 'date', key: 'date',
      render: (v) => <span className="text-muted-foreground whitespace-nowrap">{format(new Date(v), 'MMM d, yyyy')}</span>
    },
    {
      title: 'Source', dataIndex: 'source', key: 'source',
      render: (v) => <Tag color="green" className="bg-emerald-50 text-emerald-700 border-emerald-200">{v}</Tag>
    },
    {
      title: 'Notes', dataIndex: 'notes', key: 'notes',
      render: (v) => <span className="text-muted-foreground">{v || '—'}</span>
    },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right',
      render: (v) => <AmountDisplay amount={v} size="sm" />
    },
    {
      title: '', key: 'action', align: 'right',
      render: (_, item) => <ActionButtons item={item} onEdit={(i) => setModal({ type: 'income', item: i })} onDelete={(id) => setConfirm({ type: 'income', id })} />
    }
  ];

  const expenseColumns = [
    {
      title: 'Date', dataIndex: 'date', key: 'date',
      render: (v) => <span className="text-muted-foreground whitespace-nowrap">{format(new Date(v), 'MMM d, yyyy')}</span>
    },
    {
      title: 'Category', dataIndex: 'category', key: 'category',
      render: (c) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center border shrink-0" style={{ backgroundColor: `${c?.color}15`, borderColor: `${c?.color}40` }}>
            <CategoryIcon iconName={c?.icon} style={{ color: c?.color }} className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium">{c?.name || '—'}</span>
        </div>
      )
    },
    {
      title: 'Notes', dataIndex: 'notes', key: 'notes',
      render: (v) => <span className="text-muted-foreground">{v || '—'}</span>
    },

    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right',
      render: (v) => <AmountDisplay amount={-v} size="sm" />
    },
    {
      title: '', key: 'action', align: 'right',
      render: (_, item) => <ActionButtons item={item} onEdit={(i) => setModal({ type: 'expense', item: i })} onDelete={(id) => setConfirm({ type: 'expense', id })} />
    }
  ];

  const billColumns = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (v) => <span className="font-semibold">{v}</span>
    },
    {
      title: 'Type', dataIndex: 'type', key: 'type',
      render: (v) => (
        <Tag className={v === 'to_pay' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
          {v === 'to_pay' ? 'To Pay' : 'To Receive'}
        </Tag>
      )
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v) => v === 'completed'
        ? <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><CheckCircle2 size={13} /> Done</span>
        : <span className="flex items-center gap-1 text-xs font-semibold text-orange-600"><Clock size={13} /> Pending</span>
    },
    {
      title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate',
      render: (v) => v ? <span className="text-muted-foreground whitespace-nowrap">{format(new Date(v), 'MMM d, yyyy')}</span> : '—'
    },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right',
      render: (v, row) => <AmountDisplay amount={row.type === 'to_receive' ? v : -v} size="sm" />
    },
    {
      title: '', key: 'action', align: 'right',
      render: (_, item) => <ActionButtons item={item} onComplete={handleComplete} onEdit={(i) => setModal({ type: 'transaction', item: i })} onDelete={(id) => setConfirm({ type: 'transaction', id })} />
    }
  ];

  if (!selectedAccount) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <ArrowLeftRight size={40} className="mb-4 opacity-40" />
        <p className="font-medium">No account selected</p>
        <p className="text-sm mt-1">Select an account from the top-bar dropdown.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <style>{`
        .ant-table-wrapper .ant-table-pagination {
          width: 100% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: flex-end !important;
          padding: 0 16px !important;
        }
        .ant-table-wrapper .ant-pagination-options {
          order: -1 !important;
          margin-right: auto !important;
          margin-left: 0 !important;
        }
      `}</style>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2"
            style={{ backgroundColor: `${selectedColor}20`, borderColor: `${selectedColor}50` }}
          >
            <span className="text-lg font-bold" style={{ color: selectedColor }}>
              {selectedAccount.name?.charAt(0)}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{selectedAccount.name} — manage income, expenses & bills</p>
          </div>
        </div>
        <Button
          onClick={() => setModal({ type: activeTab === 'income' ? 'income' : activeTab === 'expense' ? 'expense' : 'transaction' })}
          className="flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          <span>Add {activeTab === 'income' ? 'Income' : activeTab === 'expense' ? 'Expense' : 'Bill'}</span>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/60 rounded-xl w-fit">
        {TABS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${activeTab === id
              ? 'bg-background shadow-sm text-foreground'
              : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            <Icon size={15} className={activeTab === id ? color : ''} />
            {label}
          </button>
        ))}
      </div>

      {/* Table & Filters Card */}
      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm mt-4">
        {/* Card Header */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/30">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={`Search ${activeTab === 'income' ? 'income' : activeTab === 'expense' ? 'expenses' : 'bills'}…`}
              className="pl-9 bg-white border-gray-200"
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPagination(); }}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
            {activeTab === 'income' && (
              <Select value={filterSource} onValueChange={(v) => { setFilterSource(v); resetPagination(); }}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200"><SelectValue placeholder="All Sources" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {INCOME_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {activeTab === 'expense' && (
              <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); resetPagination(); }}>
                <SelectTrigger className="w-[160px] bg-white border-gray-200"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id} className="rounded-lg">
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${c.color}15` }}>
                          <CategoryIcon iconName={c.icon} style={{ color: c.color }} className="w-2.5 h-2.5" />
                        </span>
                        <span>{c.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {activeTab === 'transaction' && (
              <Select value={filterType} onValueChange={handleFilterTypeChange}>
                <SelectTrigger className="w-[140px] bg-white border-gray-200"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="to_pay">To Pay</SelectItem>
                  <SelectItem value="to_receive">To Receive</SelectItem>
                </SelectContent>
              </Select>
            )}
            <DatePicker.RangePicker
              className="h-9 rounded-md border-gray-200 shadow-sm"
              onChange={(dates) => { setDateRange(dates); resetPagination(); }}
            />
          </div>
        </div>
        {activeTab === 'income' && (
          <Table
            columns={incomeColumns}
            dataSource={incomeData}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{
              current: incomePage,
              pageSize,
              total: incomeTotal,
              onChange: (p, sz) => {
                setIncomePage(p);
                setPageSize(sz);
              },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
          />
        )}
        {activeTab === 'expense' && (
          <Table
            columns={expenseColumns}
            dataSource={expenseData}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{
              current: expensePage,
              pageSize,
              total: expenseTotal,
              onChange: (p, sz) => {
                setExpensePage(p);
                setPageSize(sz);
              },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
          />
        )}
        {activeTab === 'transaction' && (
          <Table
            columns={billColumns}
            dataSource={billData}
            rowKey="id"
            loading={loading}
            size="small"
            pagination={{
              current: billPage,
              pageSize,
              total: billTotal,
              onChange: (p, sz) => {
                setBillPage(p);
                setPageSize(sz);
              },
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100']
            }}
          />
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'income' && (
        <IncomeModal
          userId={selectedAccountId}
          editItem={modal.item}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal?.type === 'expense' && (
        <ExpenseModal
          userId={selectedAccountId}
          editItem={modal.item}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
      {modal?.type === 'transaction' && (
        <BillModal
          userId={selectedAccountId}
          editItem={modal.item}
          categories={categories}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={!!confirm}
        message="Are you sure you want to delete this record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirm(null)}
        loading={deleting}
      />
    </div>
  );
}
