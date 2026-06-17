import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { adminService } from '../services/admin.service.js';
import useAdminStore from '../store/useAdminStore.js';
import StatCard from '../components/ui/StatCard.jsx';
import ChartCard from '../components/ui/ChartCard.jsx';
import AmountDisplay, { formatINR } from '../components/ui/AmountDisplay.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border rounded-lg p-3 shadow-md text-sm">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatINR(p.value)}
        </p>
      ))}
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

export default function AccountPage() {
  const { userId } = useParams();
  const getAccount = useAdminStore((s) => s.getAccount);
  const getAccountColor = useAdminStore((s) => s.getAccountColor);
  const account = getAccount(userId);
  const color = getAccountColor(userId);

  const [month, setMonth] = useState(getCurrentMonth());
  const [summary, setSummary] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recent, setRecent] = useState([]);
  const [topExpenses, setTopExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    return { value, label };
  });

  useEffect(() => {
    loadAll();
  }, [userId, month]);

  async function loadAll() {
    setLoading(true);
    try {
      const [sum, mon, cats, rec, top] = await Promise.all([
        adminService.userSummary(userId, month),
        adminService.userMonthly(userId, 6),
        adminService.userCategoryBreakdown(userId, month),
        adminService.userRecent(userId, 10, month),
        adminService.userTopExpenses(userId, 5, month),
      ]);
      setSummary(sum);
      setMonthly(mon);
      setCategories(cats);
      setRecent(rec.data || []);
      setTopExpenses(top);
    } catch {
      toast.error('Failed to load account data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border-2" style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}>
            <span className="text-xl font-bold" style={{ color }}>{account?.name?.charAt(0) || '?'}</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{account?.name || 'Account'}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{account?.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick nav links */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Expenses', to: `/accounts/${userId}/expenses` },
          { label: 'Income', to: `/accounts/${userId}/income` },
          { label: 'Transactions', to: `/accounts/${userId}/transactions` },
          { label: 'Stats', to: `/accounts/${userId}/stats` },
        ].map((l) => (
          <Button key={l.to} variant="outline" size="sm" asChild>
            <Link to={l.to}>
              {l.label} <ArrowRight size={14} className="ml-1.5 text-muted-foreground" />
            </Link>
          </Button>
        ))}
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="py-12 flex justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading data…
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Balance (All Time)" value={formatINR(summary?.balance || 0)} icon={Wallet} colorClass="text-primary" bgClass="bg-primary/10" />
            <StatCard label={`Income (${summary?.month})`} value={formatINR(summary?.monthIncome || 0)} icon={TrendingUp} colorClass="text-emerald-600" bgClass="bg-emerald-600/10" />
            <StatCard label={`Expenses (${summary?.month})`} value={formatINR(summary?.monthExpense || 0)} icon={TrendingDown} colorClass="text-destructive" bgClass="bg-destructive/10" />
            <StatCard label="Pending Bills" value={formatINR((summary?.pendingToPay || 0) + (summary?.pendingToReceive || 0))} sub={`Pay: ${formatINR(summary?.pendingToPay || 0)} · Rcv: ${formatINR(summary?.pendingToReceive || 0)}`} icon={Clock} colorClass="text-orange-500" bgClass="bg-orange-500/10" />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Monthly Trend" subtitle="Last 6 months">
              <div className="h-[240px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} barSize={12} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 10 }} />
                    <Bar dataKey="income" name="Income" fill="hsl(142.1 76.2% 36.3%)" radius={[4,4,0,0]} />
                    <Bar dataKey="expense" name="Expense" fill="hsl(0 84.2% 60.2%)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard title="Category Breakdown" subtitle={`Expenses by category — ${summary?.month}`}>
              {categories.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center gap-6 mt-2 h-full">
                  <div className="w-full sm:w-1/2 h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={categories} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2}>
                          {categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full sm:w-1/2 flex flex-col gap-3">
                    {categories.slice(0, 5).map((c) => (
                      <div key={c.categoryId} className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                        <span className="text-sm text-muted-foreground flex-1 truncate">{c.name}</span>
                        <span className="text-sm font-semibold">{formatINR(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-muted-foreground">
                  <p>No expenses this period</p>
                </div>
              )}
            </ChartCard>
          </div>

          {/* Recent activity + top expenses */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
                  <Link to={`/accounts/${userId}/expenses`}>
                    View all <ArrowRight size={14} className="ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="pt-2">
                {recent.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground"><p>No activity this period</p></div>
                ) : (
                  <div className="divide-y">
                    {recent.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 py-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                          <span className="text-lg">
                            {item.type === 'income' ? '💰' : '💸'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{format(new Date(item.date), 'MMM d, yyyy')}</div>
                        </div>
                        <AmountDisplay amount={item.amount} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Top Expenses</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                {topExpenses.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground"><p>No expenses this period</p></div>
                ) : (
                  <div className="divide-y">
                    {topExpenses.map((e, i) => (
                      <div key={e.id} className="flex items-center gap-3 py-3">
                        <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{e.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{e.categoryName} · {format(new Date(e.date), 'MMM d')}</div>
                        </div>
                        <span className="text-sm font-semibold text-destructive shrink-0">{formatINR(e.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
