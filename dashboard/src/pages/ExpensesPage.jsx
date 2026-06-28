import { useEffect } from 'react';
import { useParams, Navigate, useLocation } from 'react-router-dom';
import useAdminStore from '../store/useAdminStore.js';

export default function ExpensesPage() {
  const { userId } = useParams();
  const location = useLocation();
  const setSelectedAccount = useAdminStore((s) => s.setSelectedAccount);

  useEffect(() => {
    if (userId) {
      setSelectedAccount(userId);
    }
  }, [userId, setSelectedAccount]);

  const search = location.search ? `${location.search}&tab=expense` : '?tab=expense';

  return <Navigate to={`/transactions${search}`} replace />;
}
