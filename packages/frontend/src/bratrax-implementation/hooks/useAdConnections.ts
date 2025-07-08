import { useEffect } from 'react';

import { useState } from 'react';
import useApp from '../../providers/App/useApp';
import { AdvertisingConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface useAdConnectionsProps {
    platformName: string;
    setIsLoading: (isLoading: boolean) => void;
}

export const useAdConnections = ({
    platformName,
    setIsLoading,
}: useAdConnectionsProps) => {
    const { health, user } = useApp();
    const [adConnections, setAdConnections] = useState<
        AdvertisingConnection[] | []
    >([]);

    useEffect(() => {
        if (user.data?.organizationUuid) fetchCrmConnections();
    }, [user]);

    const fetchCrmConnections = async () => {
        const adConnections = await apiService.getAdvertisingConnections(
            platformName,
        );
        setAdConnections(adConnections.data);
        setIsLoading(false);
    };

    return { adConnections };
};
