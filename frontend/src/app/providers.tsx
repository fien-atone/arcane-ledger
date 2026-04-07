import '@/shared/i18n';
import { ApolloProvider } from '@apollo/client/react';
import { RouterProvider } from 'react-router-dom';
import { apolloClient } from '@/shared/api/apolloClient';
import { ConnectionLostOverlay } from '@/shared/ui/ConnectionLostOverlay';
import { ToastContainer } from '@/shared/ui/ToastContainer';
import { GlobalLoadingBar } from '@/shared/ui/GlobalLoadingBar';
import { router } from './router';

export const Providers = () => (
  <ApolloProvider client={apolloClient}>
    <GlobalLoadingBar />
    <RouterProvider router={router} />
    <ConnectionLostOverlay />
    <ToastContainer />
  </ApolloProvider>
);
