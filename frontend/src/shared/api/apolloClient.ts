import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink, split, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { useConnectionStore } from './connectionStatus';
import { useLoadingStore } from './loadingStore';

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
  // Only show error overlay for network failures (server unreachable)
  // NOT for GraphQL errors (those are handled per-query)
  const networkError = errorResponse.networkError;
  if (networkError) {
    useConnectionStore.getState().setBackendDown(true);
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
