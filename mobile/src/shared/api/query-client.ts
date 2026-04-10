import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { reportTelemetryError, serializeTelemetryKey } from '@/src/features/observability/telemetry';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      reportTelemetryError({
        context: {
          mutationKey: mutation.options.mutationKey
            ? serializeTelemetryKey(mutation.options.mutationKey)
            : null,
        },
        error,
        source: 'mutation',
      });
    },
  }),
  queryCache: new QueryCache({
    onError: (error, query) => {
      reportTelemetryError({
        context: {
          queryKey: serializeTelemetryKey(query.queryKey),
        },
        error,
        source: 'query',
      });
    },
  }),
  defaultOptions: {
    mutations: {
      retry: 0,
    },
    queries: {
      gcTime: 5 * 60 * 1000,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30 * 1000,
    },
  },
});
