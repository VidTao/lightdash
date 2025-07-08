import { useEffect } from 'react';

import { useState } from 'react';
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
    const { user } = useApp();
    const [platformConnection, setPlatformConnection] =
        useState<PlatformConnection | null>(null);

    useEffect(() => {
        if (user.data?.organizationUuid) fetchPlatformConnection();
    }, [user]);

    const fetchPlatformConnection = async () => {
        const platformConnection = await apiService.getPlatformConnection(
            platformName,
        );
        setPlatformConnection(platformConnection.data);
        setIsLoading(false);
    };

    return { platformConnection };
};
