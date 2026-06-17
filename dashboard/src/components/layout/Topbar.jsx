import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import useAdminStore from '../../store/useAdminStore.js';

function getBreadcrumbs(pathname, accounts) {
  const parts = pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Overview', to: '/' }];

  if (parts[0] === 'accounts') {
    crumbs[0] = { label: 'Overview', to: '/' };
    if (!parts[1]) {
      crumbs.push({ label: 'All Accounts', to: '/accounts' });
    } else {
      const userId = parts[1];
      const acc = accounts.find((a) => a.id === userId);
      crumbs.push({ label: 'Accounts', to: '/accounts' });
      crumbs.push({ label: acc?.name || 'Account', to: `/accounts/${userId}` });
      if (parts[2]) {
        crumbs.push({ label: parts[2].charAt(0).toUpperCase() + parts[2].slice(1), to: null });
      }
    }
  }

  return crumbs;
}

export default function Topbar() {
  const location = useLocation();
  const accounts = useAdminStore((s) => s.accounts);
  const crumbs = getBreadcrumbs(location.pathname, accounts);

  return (
    <header className="h-14 border-b bg-background flex items-center px-6 shrink-0">
      <nav className="flex flex-1 items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={14} className="text-muted-foreground" />}
            {c.to && i < crumbs.length - 1 ? (
              <Link to={c.to} className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                {c.label}
              </Link>
            ) : (
              <span className="text-foreground font-semibold">
                {c.label}
              </span>
            )}
          </span>
        ))}
      </nav>
    </header>
  );
}
