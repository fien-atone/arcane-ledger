import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/widgets/Sidebar';
import { DiceRoller } from '@/widgets/DiceRollerModal';
import { useCampaignUiStore } from '@/features/campaigns/model/store';

export function CampaignShell() {
  const collapsed = useCampaignUiStore((s) => s.sidebarCollapsed);
  return (
    <div className="flex h-screen bg-surface text-on-surface overflow-hidden">
      <Sidebar />
      <main
        className={`flex-1 overflow-auto transition-all duration-300 ${
          collapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <Outlet />
      </main>
      <DiceRoller />
    </div>
  );
}
