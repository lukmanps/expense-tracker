import { Outlet } from 'react-router-dom';
import BottomNav from '../components/ui/BottomNav';

export default function MobileLayout() {
  return (
    <div className="min-h-screen bg-bg max-w-lg mx-auto relative">
      <main className="pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
