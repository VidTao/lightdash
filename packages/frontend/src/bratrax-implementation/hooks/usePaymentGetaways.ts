import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import { PaymentGatewaySettings } from '../models/interfaces';
import { apiService } from '../services/api';

export const usePaymentGateways = () => {
    const { isAuthSet } = useApp();
    const [paymentGateways, setPaymentGateways] = useState<
        PaymentGatewaySettings[]
    >([]);
    const [isLoading, setIsLoading] = useState(false);
    const fetchPaymentGateways = async () => {
        try {
            setIsLoading(true);
            const results = await apiService.getPaymentGateways();
            setPaymentGateways(results.data);
        } catch (error) {
            console.error('Error fetching payment gateways:', error);
        } finally {
            setIsLoading(false);
        }
    };
    useEffect(() => {
        if (isAuthSet) {
            fetchPaymentGateways();
        }
    }, [isAuthSet]);

    return {
        paymentGateways,
        fetchPaymentGateways,
        isLoading,
        setPaymentGateways,
    };
};
