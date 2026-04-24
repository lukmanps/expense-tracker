import Card from './Card';

export default function SummaryCard({ title, amount, icon: Icon, color, trend }) {
  const isPositive = amount >= 0;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted font-medium uppercase tracking-wider">{title}</p>
          <p className={`text-lg font-bold ${isPositive ? 'text-text' : 'text-danger'}`}>
            ₹{Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend >= 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
    </Card>
  );
}
