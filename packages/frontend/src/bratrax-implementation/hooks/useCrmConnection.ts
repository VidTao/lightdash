import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { CrmConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface UseCrmConnectionProps {
    platformName: string;
    setIsLoading: (isLoading: boolean) => void;
}

export const useCrmConnection = ({
    platformName,
    setIsLoading,
}: UseCrmConnectionProps) => {
    const { isAuthSet } = useApp();
    const [crmConnections, setCrmConnections] = useState<CrmConnection[]>([]);

    useEffect(() => {
        const fetchCrmConnections = async () => {
            try {
                const response = await apiService.getCRMConnection(platformName);
                if (response.data) {
                    setCrmConnections(response.data);
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching CRM connections:', error);
                setCrmConnections([]);
                setIsLoading(false);
            }
        };

        if (isAuthSet) {
            fetchCrmConnections();
        }
    }, [isAuthSet, platformName]);

    return { crmConnections };
};

