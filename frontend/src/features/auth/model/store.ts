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
      }
    }
  }
`;

export interface AuthUser {
  email: string;
  name: string;
  systemRole: 'admin' | 'user';
}

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,

      login: async (email, password) => {
        try {
          const { data } = await apolloClient.mutate<{
            login: { token: string; user: { id: string; email: string; name: string; avatar?: string } };
          }>({
            mutation: LOGIN_MUTATION,
            variables: { email, password },
          });

          if (data?.login) {
            const { token, user } = data.login;
            localStorage.setItem('auth_token', token);

            set({
              user: {
                email: user.email,
                name: user.name,
                // Derive systemRole from server response — admin if email contains 'admin'
                systemRole: user.email === 'admin' ? 'admin' : 'user',
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

    }),
    { name: 'arcane-auth' },
  ),
);
