import { QueryClient } from '@tanstack/react-query';

// Centralizamos a configuração do QueryClient para permitir caching e offline support planejado.
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutos de dados "frescos"
            gcTime: 1000 * 60 * 60 * 24, // Mantém no cache por 24h para suporte offline
            retry: 1, // Tenta apenas uma vez antes de falhar
            refetchOnWindowFocus: false, // Evita refetch excessivo ao trocar de aba
        },
    },
});
