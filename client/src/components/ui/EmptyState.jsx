import { Inbox } from 'lucide-react';

export default function EmptyState({ title, description, icon: Icon = Inbox, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
