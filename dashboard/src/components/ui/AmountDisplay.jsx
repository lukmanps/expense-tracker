import { cn } from "@/lib/utils";

export function formatINR(amount) {
  if (amount === undefined || amount === null) return '₹0';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `₹${formatted}`;
}

export default function AmountDisplay({ amount, showSign = true, size = 'md', className }) {
  const isPositive = amount >= 0;
  const sign = showSign ? (isPositive ? '+' : '-') : '';
  
  const sizes = { 
    sm: "text-sm", 
    md: "text-base", 
    lg: "text-lg", 
    xl: "text-2xl" 
  };

  return (
    <span className={cn(
      "font-semibold tabular-nums tracking-tight",
      isPositive ? "text-emerald-600" : "text-destructive",
      sizes[size] || sizes.md,
      className
    )}>
      {sign}{formatINR(Math.abs(amount))}
    </span>
  );
}
