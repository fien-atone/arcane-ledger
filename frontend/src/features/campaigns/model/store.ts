import { create } from 'zustand';

interface CampaignUiState {
  sidebarCollapsed: boolean;
  editMode: boolean;
  toggleSidebar: () => void;
  setEditMode: (v: boolean) => void;
}

export const useCampaignUiStore = create<CampaignUiState>((set) => ({
  sidebarCollapsed: false,
  editMode: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setEditMode: (v) => set({ editMode: v }),
}));
