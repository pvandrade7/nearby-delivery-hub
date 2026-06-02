import { QueryClient } from "@tanstack/react-query";

/**
 * Singleton do QueryClient — compartilhado entre App.tsx e useAuth
 * para que o cache possa ser limpo no logout sem dependência circular.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
});
