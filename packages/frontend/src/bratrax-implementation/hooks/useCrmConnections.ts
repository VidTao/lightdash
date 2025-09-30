import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { CrmConnection } from '../models/interfaces';
import { apiService } from '../services/api';

export const useCrmConnections = () => {
    const { isAuthSet } = useApp();
    const [crmConnections, setCrmConnections] = useState<Record<string, CrmConnection[]>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthSet) {
            fetchAllCrmConnections();
        }
    }, [isAuthSet]);

    const fetchAllCrmConnections = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await apiService.getAllCRMConnections();
            if (response.success) {
                setCrmConnections(response.data);
            } else {
                setError('Failed to fetch CRM connections');
                setCrmConnections({});
            }
        } catch (error) {
            console.error('Error fetching CRM connections:', error);
            setError('Failed to fetch CRM connections');
            setCrmConnections({});
        } finally {
            setIsLoading(false);
        }
    };

    return { crmConnections, isLoading, error, refetch: fetchAllCrmConnections };
};
