import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apolloClient } from '@/shared/api/apolloClient';
import { useConnectionStore } from '@/shared/api/connectionStatus';
import { gql } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        id
        email
        name
        avatar
        role
      }
    }
  }
`;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  systemRole: 'admin' | 'user';
}

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (patch: Partial<Pick<AuthUser, 'name'>>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      login: async (email, password) => {
        try {
          const { data } = await apolloClient.mutate<{
            login: { token: string; user: { id: string; email: string; name: string; avatar?: string; role: string } };
          }>({
            mutation: LOGIN_MUTATION,
            variables: { email, password },
          });

          if (data?.login) {
            const { token, user } = data.login;
            localStorage.setItem('auth_token', token);

            set({
              user: {
                id: user.id,
                email: user.email,
                name: user.name,
                systemRole: (user.role?.toLowerCase() === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
              },
            });
            return true;
          }
          return false;
        } catch (err: any) {
          // Only show error overlay for network failures, not auth errors
          const isNetwork = err?.networkError || err?.message?.includes('Failed to fetch');
          if (isNetwork) {
            useConnectionStore.getState().setBackendDown(true);
          }
          return false;
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        apolloClient.clearStore();
        set({ user: null });
      },

      updateUser: (patch) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...patch } : null,
        }));
      },

    }),
    { name: 'arcane-auth' },
  ),
);
