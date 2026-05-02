export default function AmountDisplay({ amount, size = 'lg', className = '' }) {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sizeClasses = {
    sm: 'text-xl font-semibold',
    md: 'text-2xl font-semibold',
    lg: 'text-4xl font-semibold',
    xl: 'text-5xl font-semibold',
  };

  return (
    <span className={`${sizeClasses[size]} tracking-tight ${className}`}>
      {amount < 0 ? '-' : ''}₹{formatted}
    </span>
  );
}
