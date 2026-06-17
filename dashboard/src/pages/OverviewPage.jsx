import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, Users, ArrowRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';
import { adminService } from '../services/admin.service.js';
import useAdminStore, { ACCOUNT_COLORS } from '../store/useAdminStore.js';
import StatCard from '../components/ui/StatCard.jsx';
import ChartCard from '../components/ui/ChartCard.jsx';
import AmountDisplay, { formatINR } from '../components/ui/AmountDisplay.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default function OverviewPage() {
  const accounts = useAdminStore((s) => s.accounts);
  const [overview, setOverview] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [month, setMonth] = useState(getCurrentMonth());
  const [loading, setLoading] = useState(true);

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    return { value, label };
  });

  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    setLoading(true);
    try {
      const [ov, mon] = await Promise.all([
        adminService.overview(month),
        adminService.overviewMonthly(6),
      ]);
      setOverview(ov);
      setMonthly(mon);
    } catch {
      toast.error('Failed to load overview');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Aggregate view across all {accounts.length} accounts
          </p>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Balance"
          value={loading ? '—' : formatINR(overview?.balance || 0)}
          sub="All accounts combined"
          icon={Wallet}
          colorClass="text-primary"
          bgClass="bg-primary/10"
        />
        <StatCard
          label="Total Income"
          value={loading ? '—' : formatINR(overview?.totalIncome || 0)}
          sub="All time"
          icon={TrendingUp}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-600/10"
        />
        <StatCard
          label="Total Expenses"
          value={loading ? '—' : formatINR(overview?.totalExpense || 0)}
          sub="All time"
          icon={TrendingDown}
          colorClass="text-destructive"
          bgClass="bg-destructive/10"
        />
        <StatCard
          label="Accounts"
          value={accounts.length}
          sub={`${overview?.userCount || 0} users tracked`}
          icon={Users}
          colorClass="text-orange-500"
          bgClass="bg-orange-500/10"
        />
      </div>

      {/* Monthly chart + accounts list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <ChartCard title="Monthly Trend" subtitle="Income vs Expenses — last 6 months (all accounts)">
            {monthly.length > 0 ? (
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthly} barSize={16} barGap={6} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: 13, paddingTop: 20 }} />
                    <Bar dataKey="income" name="Income" fill="hsl(142.1 76.2% 36.3%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="hsl(0 84.2% 60.2%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading chart…
              </div>
            )}
          </ChartCard>
        </div>

        {/* Accounts summary */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Accounts</CardTitle>
            <Button variant="ghost" size="sm" asChild className="h-8 text-xs">
              <Link to="/accounts">
                View all <ArrowRight size={14} className="ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto">
            <div className="space-y-2 pt-2">
              {accounts.map((acc, i) => {
                const color = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
                const bal = acc.balance;
                return (
                  <Link
                    key={acc.id}
                    to={`/accounts/${acc.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}>
                      <span className="text-sm font-bold" style={{ color }}>{acc.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{acc.name}</div>
                      <div className="text-xs text-muted-foreground flex gap-2 mt-0.5">
                        <span className="text-emerald-600 font-medium">↑ {formatINR(acc.totalIncome)}</span>
                        <span className="text-destructive font-medium">↓ {formatINR(acc.totalExpense)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <AmountDisplay amount={bal} size="sm" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
