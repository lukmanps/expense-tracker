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

const SOURCES = ['Salary', 'Freelance', 'Gift', 'Investment', 'Other'];

export default function IncomePage() {
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
  const [source, setSource] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { setPage(1); }, [search, source, startDate, endDate, userId]);
  useEffect(() => { loadData(); }, [userId, page, search, source, startDate, endDate]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await adminService.userIncomes(userId, { 
        page, 
        limit: 20, 
        search, 
        source: source === 'all' ? undefined : source, 
        startDate: startDate || undefined, 
        endDate: endDate || undefined 
      });
      setData(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch {
      toast.error('Failed to load income');
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
      key: 'source', label: 'Source',
      render: (v) => (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{v}</Badge>
      ),
    },
    {
      key: 'notes', label: 'Notes',
      render: (v) => <span className="text-muted-foreground text-sm block max-w-[200px] truncate">{v || '—'}</span>,
    },
    {
      key: 'amount', label: 'Amount', className: "text-right",
      render: (v) => <AmountDisplay amount={v} size="sm" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Income</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-semibold" style={{ color }}>{account?.name}</span> — income history
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search income…" 
            className="pl-9" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <Select value={source} onValueChange={setSource}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input 
          type="date" 
          className="w-[155px]" 
          value={startDate} 
          onChange={(e) => setStartDate(e.target.value)} 
        />
        <Input 
          type="date" 
          className="w-[155px]" 
          value={endDate} 
          onChange={(e) => setEndDate(e.target.value)} 
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        emptyMessage="No income records found"
      />
    </div>
  );
}
