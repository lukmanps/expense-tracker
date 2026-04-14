export default function SkeletonLoader({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-3 w-16 rounded" />
        </div>
        <div className="skeleton h-5 w-16 rounded" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="skeleton h-32 rounded-2xl" />
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
      <div className="skeleton h-6 w-40 rounded mt-4" />
      {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}
