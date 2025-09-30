import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { AdvertisingConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface UseAdConnectionProps {
    platformName: string;
    setIsLoading: (isLoading: boolean) => void;
}

export const useAdConnection = ({
    platformName,
    setIsLoading,
}: UseAdConnectionProps) => {
    const { isAuthSet } = useApp();
    const [adConnections, setAdConnections] = useState<AdvertisingConnection[]>([]);

    useEffect(() => {
        const fetchAdConnections = async () => {
            try {
                const response = await apiService.getAdvertisingConnection(platformName);
                if (response.data) {
                    setAdConnections(response.data);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching advertising connections:', error);
                setAdConnections([]);
                setIsLoading(false);
            }
        };

        if (isAuthSet) {
            fetchAdConnections();
        }
    }, [isAuthSet, platformName]);

    return { adConnections };
};

