import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { AdvertisingConnection } from '../models/interfaces';
import { apiService } from '../services/api';

export const useAdConnections = () => {
    const { isAuthSet } = useApp();
    const [adConnections, setAdConnections] = useState<Record<string, AdvertisingConnection[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthSet) {
            fetchAllAdConnections();
        }
    }, [isAuthSet]);

    const fetchAllAdConnections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await apiService.getAllAdvertisingConnections();
            if (response.success) {
                setAdConnections(response.data);
            } else {
                setError('Failed to fetch advertising connections');
                setAdConnections({});
            }
        } catch (error) {
            console.error('Error fetching advertising connections:', error);
            setError('Failed to fetch advertising connections');
            setAdConnections({});
        } finally {
            setIsLoading(false);
        }
    };

    return { adConnections, isLoading, error, refetch: fetchAllAdConnections };
};
