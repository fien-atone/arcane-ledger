import { Outlet } from 'react-router-dom';
import { Topbar } from '@/widgets/Topbar';
import { GlobalLoadingBar } from '@/shared/ui/GlobalLoadingBar';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col">
      <Topbar />
      <div className="flex-1 relative">
        <GlobalLoadingBar />
        <Outlet />
      </div>
    </div>
  );
}
