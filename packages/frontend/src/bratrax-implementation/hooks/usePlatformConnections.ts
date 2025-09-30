import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

export const usePlatformConnections = () => {
    const { isAuthSet } = useApp();
    const [platformConnections, setPlatformConnections] = useState<Record<string, PlatformConnection>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthSet) {
            fetchAllPlatformConnections();
        }
    }, [isAuthSet]);

    const fetchAllPlatformConnections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await apiService.getAllPlatformConnections();
            if (response.success) {
                setPlatformConnections(response.data);
            } else {
                setError('Failed to fetch platform connections');
                setPlatformConnections({});
            }
        } catch (error) {
            console.error('Error fetching platform connections:', error);
            setError('Failed to fetch platform connections');
            setPlatformConnections({});
        } finally {
            setIsLoading(false);
        }
    };

    return { platformConnections, isLoading, error, refetch: fetchAllPlatformConnections };
};
