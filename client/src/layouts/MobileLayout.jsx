import { Outlet } from 'react-router-dom';
import BottomNav from '../components/ui/BottomNav';

export default function MobileLayout() {
  return (
    <div className="h-full bg-bg max-w-lg mx-auto relative flex flex-col overflow-hidden">
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
