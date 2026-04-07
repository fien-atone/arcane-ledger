import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink, split, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { useConnectionStore } from './connectionStatus';
import { useLoadingStore } from './loadingStore';
import { showToast } from '@/shared/ui/toastStore';

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || 'http://localhost:4000/graphql';
const GRAPHQL_WS_URL = import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql';

const httpLink = createHttpLink({ uri: GRAPHQL_URL });

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('auth_token');
  return {
    headers: {
      ...headers,
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  };
});

// Track in-flight requests for the global loading bar
const loadingLink = new ApolloLink((operation, forward) => {
  const { increment, decrement } = useLoadingStore.getState();
  increment();
  let decremented = false;
  const decrementOnce = () => {
    if (!decremented) {
      decremented = true;
      decrement();
    }
  };
  const observable = forward(operation);
  return new (observable.constructor as any)((observer: any) => {
    const sub = observable.subscribe({
      next: (value: any) => observer.next(value),
      error: (err: any) => { decrementOnce(); observer.error(err); },
      complete: () => { decrementOnce(); observer.complete(); },
    });
    return () => { decrementOnce(); sub.unsubscribe(); };
  });
});

const errorLink = onError((errorResponse: any) => {
  const networkError = errorResponse.networkError;
  const graphQLErrors = errorResponse.graphQLErrors;
  const operationKind = errorResponse.operation?.query?.definitions?.[0]?.operation;

  // Network failures: show full-screen overlay
  if (networkError) {
    useConnectionStore.getState().setBackendDown(true);
    return;
  }

  // GraphQL errors: show toast for mutations (so users see save/delete failures).
  // Queries usually have inline error display via the page's isError state.
  if (graphQLErrors && graphQLErrors.length > 0 && operationKind === 'mutation') {
    for (const err of graphQLErrors) {
      const code = err.extensions?.code;
      // Skip auth errors — let route guards handle them
      if (code === 'UNAUTHENTICATED') continue;
      showToast({
        kind: 'error',
        message: err.message || 'Something went wrong',
      });
    }
  }
});

const wsLink = new GraphQLWsLink(
  createClient({
    url: GRAPHQL_WS_URL,
    connectionParams: () => {
      const token = localStorage.getItem('auth_token');
      return token ? { authorization: `Bearer ${token}` } : {};
    },
  }),
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
  },
  wsLink,
  from([loadingLink, errorLink, authLink.concat(httpLink)]),
);

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'no-cache',
      notifyOnNetworkStatusChange: false,
    },
    query: {
      fetchPolicy: 'no-cache',
    },
  },
});
