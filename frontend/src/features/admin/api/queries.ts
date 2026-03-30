import { gql } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client/react';
import type { User } from '@/entities/user';

// ── Queries ──────────────────────────────────────────────────────────────────

const ADMIN_USERS = gql`
  query AdminUsers($search: String) {
    adminUsers(search: $search) {
      id
      email
      name
      avatar
      role
      createdAt
    }
  }
`;

export function useAdminUsers(search?: string) {
  const { data, loading, error, refetch } = useQuery<any>(ADMIN_USERS, {
    variables: { search: search || undefined },
    fetchPolicy: 'cache-and-network',
  });
  return { data: data?.adminUsers as User[] | undefined, isLoading: loading, isError: !!error, refetch };
}

// ── Mutations ────────────────────────────────────────────────────────────────

const ADMIN_CREATE_USER = gql`
  mutation AdminCreateUser($input: AdminCreateUserInput!) {
    adminCreateUser(input: $input) {
      id
      email
      name
      role
    }
  }
`;

const ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($id: ID!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      id
      email
      name
      role
    }
  }
`;

const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($id: ID!) {
    adminDeleteUser(id: $id)
  }
`;

export function useCreateUser() {
  const [mutate, { loading }] = useMutation(ADMIN_CREATE_USER, {
    refetchQueries: ['AdminUsers'],
  });
  return {
    mutate: (input: { name: string; email: string; password: string; role?: string }) =>
      mutate({ variables: { input } }),
    isPending: loading,
  };
}

export function useUpdateUser() {
  const [mutate, { loading }] = useMutation(ADMIN_UPDATE_USER, {
    refetchQueries: ['AdminUsers'],
  });
  return {
    mutate: (id: string, input: { name?: string; email?: string; password?: string; role?: string }) =>
      mutate({ variables: { id, input } }),
    isPending: loading,
  };
}

export function useDeleteUser() {
  const [mutate, { loading }] = useMutation(ADMIN_DELETE_USER, {
    refetchQueries: ['AdminUsers'],
  });
  return {
    mutate: (id: string) => mutate({ variables: { id } }),
    isPending: loading,
  };
}
