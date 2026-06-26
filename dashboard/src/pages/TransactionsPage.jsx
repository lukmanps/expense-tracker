import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Table, Tag } from 'antd';
import { adminService } from '../services/admin.service.js';
import useAdminStore from '../store/useAdminStore.js';
import AmountDisplay from '../components/ui/AmountDisplay.jsx';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock } from 'lucide-react';

export default function TransactionsPage() {
  const { userId } = useParams();
  const getAccount = useAdminStore((s) => s.getAccount);
  const getAccountColor = useAdminStore((s) => s.getAccountColor);
  const account = getAccount(userId);
  const color = getAccountColor(userId);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const pageSize = 20;

  useEffect(() => { setPage(1); }, [search, type, status, userId]);
  useEffect(() => { loadData(); }, [userId, page, search, type, status]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminService.userTransactions(userId, { 
        page, 
        limit: pageSize, 
        search: search || undefined, 
        type: type === 'all' ? undefined : type, 
        status: status === 'all' ? undefined : status 
      });
      setData(res.items || []);
      setTotal(res.total || 0);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      title: 'Name', dataIndex: 'name', key: 'name',
      render: (v) => <span className="font-semibold text-sm">{v}</span>,
    },
    {
      title: 'Type', dataIndex: 'type', key: 'type',
      render: (v) => (
        <Tag className={v === 'to_pay' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
          {v === 'to_pay' ? 'To Pay' : 'To Receive'}
        </Tag>
      ),
    },
    {
      title: 'Status', dataIndex: 'status', key: 'status',
      render: (v) => v === 'completed'
        ? <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground"><CheckCircle2 size={13} /> Done</span>
        : <span className="flex items-center gap-1 text-xs font-semibold text-orange-600"><Clock size={13} /> Pending</span>
    },
    {
      title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate',
      render: (v) => v ? <span className="text-muted-foreground text-xs whitespace-nowrap">{format(new Date(v), 'MMM d, yyyy')}</span> : <span className="text-muted-foreground">—</span>,
    },
    {
      title: 'Notes', dataIndex: 'notes', key: 'notes',
      render: (v) => <span className="text-muted-foreground text-sm block max-w-[200px] truncate">{v || '—'}</span>,
    },
    {
      title: 'Amount', dataIndex: 'amount', key: 'amount', align: 'right',
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

      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search transactions…" 
            className="pl-9 bg-gray-50/50 border-gray-200" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[160px] bg-gray-50/50 border-gray-200">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="to_pay">To Pay</SelectItem>
            <SelectItem value="to_receive">To Receive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px] bg-gray-50/50 border-gray-200">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false
          }}
        />
      </div>
    </div>
  );
}
