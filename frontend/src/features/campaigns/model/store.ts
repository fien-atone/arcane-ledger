import { create } from 'zustand';

interface CampaignUiState {
  sidebarCollapsed: boolean;
  editMode: boolean;
  /** User explicitly toggled — disables auto-collapse */
  manualOverride: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setEditMode: (v: boolean) => void;
}

export const useCampaignUiStore = create<CampaignUiState>((set) => ({
  sidebarCollapsed: false,
  editMode: false,
  manualOverride: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed, manualOverride: true })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setEditMode: (v) => set({ editMode: v }),
}));
