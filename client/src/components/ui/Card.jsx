export default function Card({ children, className = '', onClick, ...props }) {
  return (
    <div
      className={`bg-surface rounded-2xl shadow-sm border border-border/50 ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}
