import { create } from 'zustand';

interface LoadingState {
  /** Number of in-flight GraphQL requests */
  count: number;
  increment: () => void;
  decrement: () => void;
}

/**
 * Tracks active GraphQL requests so the global loading bar can show
 * progress while the network is busy. Apollo link increments on request
 * start and decrements on response (success or error).
 */
export const useLoadingStore = create<LoadingState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: Math.max(0, state.count - 1) })),
}));
