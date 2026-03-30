import { create } from 'zustand';

interface ConnectionState {
  backendDown: boolean;
  lastError: string | null;
  setBackendDown: (down: boolean, error?: string) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  backendDown: false,
  lastError: null,
  setBackendDown: (down, error) => set({ backendDown: down, lastError: error ?? null }),
}));
