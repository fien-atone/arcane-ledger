import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const UPDATE_PROFILE = gql`
  mutation UpdateProfile($name: String!) {
    updateProfile(name: $name) {
      id
      name
      email
    }
  }
`;

const CHANGE_PASSWORD = gql`
  mutation ChangePassword(
    $currentPassword: String!
    $newPassword: String!
    $confirmPassword: String!
  ) {
    changePassword(
      currentPassword: $currentPassword
      newPassword: $newPassword
      confirmPassword: $confirmPassword
    )
  }
`;

export function useUpdateProfile() {
  const [mutate, { loading, error }] = useMutation<{
    updateProfile: { id: string; name: string; email: string };
  }>(UPDATE_PROFILE);

  return {
    mutate: (name: string) => mutate({ variables: { name } }),
    loading,
    error,
  };
}

export function useChangePassword() {
  const [mutate, { loading, error }] = useMutation<{
    changePassword: boolean;
  }>(CHANGE_PASSWORD);

  return {
    mutate: (currentPassword: string, newPassword: string, confirmPassword: string) =>
      mutate({ variables: { currentPassword, newPassword, confirmPassword } }),
    loading,
    error,
  };
}
