import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from '@/features/auth';
import { AppLayout } from './AppLayout';
import { CampaignShell } from '@/widgets/CampaignShell';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const CampaignsPage = lazy(() => import('@/pages/CampaignsPage'));
const CampaignDashboardPage = lazy(() => import('@/pages/CampaignDashboardPage'));
const NpcListPage = lazy(() => import('@/pages/NpcListPage'));
const NpcDetailPage = lazy(() => import('@/pages/NpcDetailPage'));
const SessionListPage = lazy(() => import('@/pages/SessionListPage'));
const SessionDetailPage = lazy(() => import('@/pages/SessionDetailPage'));
const LocationListPage = lazy(() => import('@/pages/LocationListPage'));
const LocationDetailPage = lazy(() => import('@/pages/LocationDetailPage'));
const GroupDetailPage = lazy(() => import('@/pages/GroupDetailPage'));
const QuestListPage = lazy(() => import('@/pages/QuestListPage'));
const QuestDetailPage = lazy(() => import('@/pages/QuestDetailPage'));
const PartyPage = lazy(() => import('@/pages/PartyPage'));
const CharacterDetailPage = lazy(() => import('@/pages/CharacterDetailPage'));
const MaterialsPage = lazy(() => import('@/pages/MaterialsPage'));
const SpeciesPage = lazy(() => import('@/pages/SpeciesPage'));

const Fallback = () => (
  <div className="flex h-screen items-center justify-center text-on-surface-variant">
    Loading...
  </div>
);

const withSuspense = (Component: React.ComponentType) => (
  <Suspense fallback={<Fallback />}>
    <Component />
  </Suspense>
);

export const router = createBrowserRouter(
  [
    // Public
    { path: '/', element: withSuspense(LandingPage) },
    { path: '/login', element: withSuspense(LoginPage) },

    // Protected
    {
      element: <ProtectedRoute />,
      children: [
        // Campaigns list — with Topbar
        {
          element: <AppLayout />,
          children: [
            { path: '/campaigns', element: withSuspense(CampaignsPage) },
          ],
        },
        // Campaign inner pages — with Sidebar
        {
          path: '/campaigns/:id',
          element: <CampaignShell />,
          children: [
            { index: true, element: withSuspense(CampaignDashboardPage) },
            { path: 'npcs', element: withSuspense(NpcListPage) },
            { path: 'npcs/:npcId', element: withSuspense(NpcDetailPage) },
            { path: 'sessions', element: withSuspense(SessionListPage) },
            { path: 'sessions/:sessionId', element: withSuspense(SessionDetailPage) },
            { path: 'locations', element: withSuspense(LocationListPage) },
            { path: 'locations/:locationId', element: withSuspense(LocationDetailPage) },
            { path: 'groups', element: withSuspense(GroupDetailPage) },
            { path: 'groups/:groupId', element: withSuspense(GroupDetailPage) },
            { path: 'quests', element: withSuspense(QuestListPage) },
            { path: 'quests/:questId', element: withSuspense(QuestDetailPage) },
            { path: 'party', element: withSuspense(PartyPage) },
            { path: 'characters/:charId', element: withSuspense(CharacterDetailPage) },
            { path: 'materials', element: withSuspense(MaterialsPage) },
            { path: 'species', element: withSuspense(SpeciesPage) },
          ],
        },
      ],
    },
  ],
  { basename: '/arcane-ledger' },
);
