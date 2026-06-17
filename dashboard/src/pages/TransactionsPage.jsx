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

export default function TransactionsPage() {
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
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => { setPage(1); }, [search, type, status, userId]);
  useEffect(() => { loadData(); }, [userId, page, search, type, status]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminService.userTransactions(userId, { 
        page, 
        limit: 20, 
        search: search || undefined, 
        type: type === 'all' ? undefined : type, 
        status: status === 'all' ? undefined : status 
      });
      setData(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: 'name', label: 'Name',
      render: (v) => <span className="font-semibold text-sm">{v}</span>,
    },
    {
      key: 'type', label: 'Type',
      render: (v) => (
        <Badge variant="outline" className={v === 'to_pay' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
          {v === 'to_pay' ? 'To Pay' : 'To Receive'}
        </Badge>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <Badge variant="secondary" className={v === 'completed' ? 'bg-muted text-muted-foreground' : 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-transparent'}>
          {v === 'completed' ? 'Completed' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'dueDate', label: 'Due Date',
      render: (v) => v ? <span className="text-muted-foreground text-xs whitespace-nowrap">{format(new Date(v), 'MMM d, yyyy')}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'notes', label: 'Notes',
      render: (v) => <span className="text-muted-foreground text-sm block max-w-[200px] truncate">{v || '—'}</span>,
    },
    {
      key: 'amount', label: 'Amount', className: "text-right",
      render: (v, row) => <AmountDisplay amount={row.type === 'to_receive' ? v : -v} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions / Bills</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-semibold" style={{ color }}>{account?.name}</span> — bills & pending transactions
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search transactions…" 
            className="pl-9" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="to_pay">To Pay</SelectItem>
            <SelectItem value="to_receive">To Receive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
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
        emptyMessage="No transactions found"
      />
    </div>
  );
}
