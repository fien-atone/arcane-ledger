import { Outlet } from 'react-router-dom';
import { Topbar } from '@/widgets/Topbar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Topbar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
