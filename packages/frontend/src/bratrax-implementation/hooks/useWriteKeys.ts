import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { apiService } from '../services/api';

export interface WriteKey {
    writeKeyId: number;
    writeKey: string;
    platform: string;
    storeName: string;
}

interface UseWriteKeysProps {
    source: string;
}

export const useWriteKeys = ({ source }: UseWriteKeysProps) => {
    const { isAuthSet } = useApp();
    const [writeKeys, setWriteKeys] = useState<WriteKey[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWriteKeys = async () => {
            if (!source) return;
            
            try {
                setIsLoading(true);
                const response = await apiService.getWriteKeys(source);

                if (response.success) {
                    setWriteKeys(response.data);
                    setError(null);
                } else {
                    setError('Failed to load write keys');
                    setWriteKeys([]);
                }
            } catch (error) {
                console.error('Error fetching write keys:', error);
                setError('Failed to load write keys');
                setWriteKeys([]);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthSet && source) {
            fetchWriteKeys();
        }
    }, [source, isAuthSet]);

    const refetch = async () => {
        if (!source) return;
        
        try {
            setIsLoading(true);
            const response = await apiService.getWriteKeys(source);

            if (response.success) {
                setWriteKeys(response.data);
                setError(null);
            } else {
                setError('Failed to load write keys');
            }
        } catch (error) {
            console.error('Error refetching write keys:', error);
            setError('Failed to load write keys');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        writeKeys,
        isLoading,
        error,
        refetch,
    };
};
