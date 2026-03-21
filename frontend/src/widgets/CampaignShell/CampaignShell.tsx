import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/Sidebar';
import { DiceRoller } from '@/widgets/DiceRollerModal';
import { useCampaignUiStore } from '@/features/campaigns/model/store';

export function CampaignShell() {
  const collapsed = useCampaignUiStore((s) => s.sidebarCollapsed);
  return (
    <div className="flex min-h-screen bg-surface text-on-surface">
      <Sidebar />
      <main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <Outlet />
      </main>
      <DiceRoller />
    </div>
  );
}
