import { useEffect } from 'react';

import { useState } from 'react';
import useApp from '../../providers/App/useApp';
import { CrmConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface useCrmConnectionsProps {
    platformName: string;
    setIsLoading: (isLoading: boolean) => void;
}

export const useCrmConnections = ({
    platformName,
    setIsLoading,
}: useCrmConnectionsProps) => {
    const { health, user } = useApp();
    const [crmConnections, setcrmConnections] = useState<CrmConnection[] | []>(
        [],
    );

    useEffect(() => {
        if (user.data?.organizationUuid) fetchCrmConnections();
    }, [user]);

    const fetchCrmConnections = async () => {
        const crmConnections = await apiService.getCRMConnections(platformName);
        setcrmConnections(crmConnections.data);
        setIsLoading(false);
    };

    return { crmConnections };
};
