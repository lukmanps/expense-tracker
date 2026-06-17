import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

export default function AdminLayout({ children }) {
  return (
    <div className="flex h-screen w-full bg-muted/20">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
