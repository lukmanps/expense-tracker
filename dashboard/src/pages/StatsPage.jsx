import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import { adminService } from '../services/admin.service.js';
import useAdminStore from '../store/useAdminStore.js';
import ChartCard from '../components/ui/ChartCard.jsx';
import { formatINR } from '../components/ui/AmountDisplay.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg p-3 shadow-md text-sm">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color }} className="font-medium">{p.name}: {formatINR(p.value)}</p>)}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg p-2 shadow-md text-sm">
      <p style={{ color: payload[0].payload.color }} className="font-semibold mb-0.5">{payload[0].name}</p>
      <p className="font-medium">{formatINR(payload[0].value)}</p>
    </div>
  );
};

export default function StatsPage() {
  const { userId } = useParams();
  const getAccount = useAdminStore((s) => s.getAccount);
  const getAccountColor = useAdminStore((s) => s.getAccountColor);
  const account = getAccount(userId);
  const color = getAccountColor(userId);

  const [month, setMonth] = useState(getCurrentMonth());
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [weekly, setWeekly] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthOptions = [
    { value: 'all', label: 'All Time' },
    { value: '6months', label: 'Last 6 Months' },
    { value: '3months', label: 'Last 3 Months' },
    ...Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      return { value, label };
    }),
  ];

  useEffect(() => { loadAll(); }, [userId, month]);

  async function loadAll() {
    setLoading(true);
    try {
      const [mon, cats, wk, top] = await Promise.all([
        adminService.userMonthly(userId, 12),
        adminService.userCategoryBreakdown(userId, month === 'all' ? '' : month),
        adminService.userWeekly(userId),
        adminService.userTopExpenses(userId, 8, month === 'all' ? '' : month),
      ]);
      setMonthly(mon);
      setCategories(cats);
      setWeekly(wk);
      setTopExpenses(top);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }

  const totalCatExpense = categories.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistics</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-semibold" style={{ color }}>{account?.name}</span> — detailed analytics
          </p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading stats…
        </div>
      ) : (
        <>
          {/* 12-month trend */}
          <ChartCard title="12-Month Trend" subtitle="Income and expenses over the last year">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(142.1 76.2% 36.3%)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(0 84.2% 60.2%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                  <Area type="monotone" dataKey="income" name="Income" stroke="hsl(142.1 76.2% 36.3%)" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="expense" name="Expense" stroke="hsl(0 84.2% 60.2%)" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Category + Weekly */}
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Category Breakdown" subtitle="Expenses by category">
              {categories.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground"><p>No data for this period</p></div>
              ) : (
                <div className="h-[260px] flex flex-col pt-2">
                  <div className="flex-1 flex justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categories} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2}>
                          {categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 max-h-[80px] overflow-y-auto pr-2">
                    {categories.map((c) => (
                      <div key={c.categoryId} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <div className="flex-1 text-xs text-muted-foreground truncate">{c.name}</div>
                        <div className="text-xs font-semibold">{formatINR(c.amount)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>

            <ChartCard title="Weekly Spending" subtitle="Daily expenses — last 7 days">
              {weekly.length > 0 ? (
                <div className="h-[260px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekly} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                      <Bar dataKey="amount" name="Expense" fill={color} radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground"><p>No data available</p></div>
              )}
            </ChartCard>
          </div>

          {/* Top expenses */}
          <Card className="flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Expenses</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {topExpenses.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground"><p>No expenses for this period</p></div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {topExpenses.map((e, i) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 border">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{e.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{e.categoryName}</div>
                      </div>
                      <div className="text-sm font-bold text-destructive shrink-0">{formatINR(e.amount)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
