import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  email: string;
  name: string;
  systemRole: 'admin' | 'user';
}

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  getCampaignRole: (campaignId: string) => 'gm' | 'player';
}

const MOCK_CREDENTIALS: Array<{ email: string; password: string; user: AuthUser }> = [
  {
    email: 'admin',
    password: 'admin',
    user: { email: 'admin', name: 'Admin', systemRole: 'admin' },
  },
  {
    email: 'user',
    password: 'user',
    user: { email: 'user', name: 'User', systemRole: 'user' },
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,

      login: (email, password) => {
        const match = MOCK_CREDENTIALS.find(
          (c) => c.email === email && c.password === password
        );
        if (match) {
          set({ user: match.user });
          return true;
        }
        return false;
      },

      logout: () => set({ user: null }),

      getCampaignRole: (_campaignId) => {
        const { user } = get();
        if (!user) return 'player';
        return user.systemRole === 'admin' || user.email === 'user' ? 'gm' : 'player';
      },
    }),
    { name: 'arcane-auth' }
  )
);
