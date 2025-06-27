import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

export const createQueryClient = (options?: DefaultOptions) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 60000, // Increase stale time to 1 minute to reduce refetches
                refetchOnWindowFocus: false,
                refetchOnMount: false, // Disable refetch on mount
                onError: async (result) => {
                    // @ts-ignore
                    const { error: { statusCode } = {} } = result;
                    if (statusCode === 401) {
                        await queryClient.invalidateQueries(['health']);
                    }
                },
                networkMode: 'always',
                ...options?.queries,
            },
            mutations: {
                networkMode: 'always',
                ...options?.mutations,
            },
        },
    });

    return queryClient;
};
