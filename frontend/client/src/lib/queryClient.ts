import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Refetch when window regains focus
      refetchOnWindowFocus: true,
      // Keep data fresh for 30 seconds
      staleTime: 30 * 1000,
      // Retry failed requests twice
      retry: 2,
      // Don't retry immediately
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});
