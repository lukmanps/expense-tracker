import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { adminService } from '../services/admin.service.js';
import useAdminStore from '../store/useAdminStore.js';
import DataTable from '../components/ui/DataTable.jsx';
import AmountDisplay from '../components/ui/AmountDisplay.jsx';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function ExpensesPage() {
  const { userId } = useParams();
  const getAccount = useAdminStore((s) => s.getAccount);
  const getAccountColor = useAdminStore((s) => s.getAccountColor);
  const account = getAccount(userId);
  const color = getAccountColor(userId);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [month, setMonth] = useState(getCurrentMonth());
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('all');

  const monthOptions = [
    { value: 'all', label: 'All Time' },
    ...Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return { value, label };
    }),
  ];

  useEffect(() => {
    adminService.userCategories(userId).then((res) => setCategories(res.categories || [])).catch(() => {});
  }, [userId]);

  useEffect(() => {
    setPage(1);
  }, [search, month, categoryId, userId]);

  useEffect(() => {
    loadData();
  }, [userId, page, search, month, categoryId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminService.userExpenses(userId, { 
        page, 
        limit: 20, 
        search, 
        month: month === 'all' ? '' : month, 
        categoryId: categoryId === 'all' ? '' : categoryId 
      });
      setData(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: 'date', label: 'Date',
      render: (v) => <span className="text-muted-foreground text-xs whitespace-nowrap">{format(new Date(v), 'MMM d, yyyy')}</span>,
    },
    {
      key: 'category', label: 'Category',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${row.category?.color}15`, borderColor: `${row.category?.color}40` }}>
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.category?.color }} />
          </div>
          <span className="font-medium text-sm whitespace-nowrap">{row.category?.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'notes', label: 'Notes',
      render: (v) => <span className="text-muted-foreground text-sm max-w-[200px] truncate block">{v || '—'}</span>,
    },
    {
      key: 'recurring', label: 'Recurring',
      render: (v) => v ? <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-100 border-transparent">Recurring</Badge> : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      key: 'amount', label: 'Amount', className: "text-right",
      render: (v) => <AmountDisplay amount={-v} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-semibold" style={{ color }}>{account?.name}</span> — expense history
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search expenses…" 
            className="pl-9" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.filter((c) => c.type === 'expense').map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No expenses found for this period"
      />
    </div>
  );
}
