import { Link } from 'react-router-dom';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import useAdminStore, { ACCOUNT_COLORS } from '../store/useAdminStore.js';
import AmountDisplay, { formatINR } from '../components/ui/AmountDisplay.jsx';
import { Card, CardContent } from "@/components/ui/card";

export default function AccountsPage() {
  const accounts = useAdminStore((s) => s.accounts);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All Accounts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {accounts.length} accounts being tracked
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {accounts.map((acc, i) => {
          const color = ACCOUNT_COLORS[i % ACCOUNT_COLORS.length];
          return (
            <Link
              key={acc.id}
              to={`/accounts/${acc.id}`}
              className="block group"
            >
              <Card className="h-full transition-shadow hover:shadow-md border-t-4" style={{ borderTopColor: color }}>
                <CardContent className="p-5">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2" style={{ backgroundColor: `${color}15`, borderColor: `${color}40` }}>
                      <span className="text-lg font-bold" style={{ color }}>{acc.name.charAt(0)}</span>
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">{acc.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {acc.phone}
                      </div>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-5">
                    <div className="text-[10px] text-muted-foreground mb-1 font-bold uppercase tracking-wider">Balance</div>
                    <AmountDisplay amount={acc.balance} size="xl" />
                  </div>

                  {/* Income / Expense row */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp size={12} className="text-emerald-600" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Income</span>
                      </div>
                      <div className="text-sm font-semibold text-emerald-600">{formatINR(acc.totalIncome)}</div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingDown size={12} className="text-destructive" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Expenses</span>
                      </div>
                      <div className="text-sm font-semibold text-destructive">{formatINR(acc.totalExpense)}</div>
                    </div>
                  </div>

                  {/* Pending bills */}
                  {(acc.pendingToPay > 0 || acc.pendingToReceive > 0) && (
                    <div className="mt-4 pt-4 border-t flex gap-3 text-xs font-medium">
                      {acc.pendingToPay > 0 && (
                        <div className="text-destructive">
                          ↑ {formatINR(acc.pendingToPay)} to pay
                        </div>
                      )}
                      {acc.pendingToReceive > 0 && (
                        <div className="text-emerald-600">
                          ↓ {formatINR(acc.pendingToReceive)} to receive
                        </div>
                      )}
                    </div>
                  )}

                  {/* View link */}
                  <div className="flex items-center gap-1 mt-5 text-sm font-semibold group-hover:underline" style={{ color }}>
                    View account <ArrowRight size={14} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
