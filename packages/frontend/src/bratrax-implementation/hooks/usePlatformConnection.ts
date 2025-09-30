import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface UsePlatformConnectionProps {
    platformName: string;
    setIsLoading: (isLoading: boolean) => void;
}

export const usePlatformConnection = ({
    platformName,
    setIsLoading,
}: UsePlatformConnectionProps) => {
    const { isAuthSet } = useApp();
    const [platformConnection, setPlatformConnection] = useState<PlatformConnection | null>(null);

    useEffect(() => {
        const fetchPlatformConnection = async () => {
            try {
                const response = await apiService.getPlatformConnection(platformName);
                if (response.data) {
                    setPlatformConnection(response.data);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching platform connection:', error);
                setPlatformConnection(null);
                setIsLoading(false);
            }
        };

        if (isAuthSet) {
            fetchPlatformConnection();
        }
    }, [isAuthSet, platformName]);

    return { platformConnection };
};
