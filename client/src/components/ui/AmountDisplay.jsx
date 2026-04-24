export default function AmountDisplay({ amount, size = 'lg', className = '' }) {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sizeClasses = {
    sm: 'text-xl font-semibold',
    md: 'text-2xl font-bold',
    lg: 'text-4xl font-extrabold',
    xl: 'text-5xl font-extrabold',
  };

  return (
    <span className={`${sizeClasses[size]} tracking-tight ${className}`}>
      ₹{formatted}
    </span>
  );
}
