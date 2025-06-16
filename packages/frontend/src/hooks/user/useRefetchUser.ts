import { useQueryClient } from '@tanstack/react-query';

// Create a custom hook for refetching
export const useRefetchUser = () => {
    const queryClient = useQueryClient();
    return () => queryClient.refetchQueries({ queryKey: ['user'] });
};
