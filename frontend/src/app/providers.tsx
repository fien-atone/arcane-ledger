import { ApolloProvider } from '@apollo/client/react';
import { RouterProvider } from 'react-router-dom';
import { apolloClient } from '@/shared/api/apolloClient';
import { ConnectionLostOverlay } from '@/shared/ui/ConnectionLostOverlay';
import { router } from './router';

export const Providers = () => (
  <ApolloProvider client={apolloClient}>
    <RouterProvider router={router} />
    <ConnectionLostOverlay />
  </ApolloProvider>
);
