import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const RechargeCallback = () => {
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthSet } = useApp();
    const navigate = useNavigate();
    const refetchUser = useRefetchUser();
    const { code } = useQueryParams();

    const hasProcessedCallback = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                if (hasProcessedCallback.current) {
                    return;
                }

                if (!code) {
                    throw new Error('No authorization code received');
                }

                // Read shop domain saved before OAuth redirect
                const shop = localStorage.getItem('pendingRechargeShop');
                if (!shop) {
                    throw new Error(
                        'No shop domain found. Please try connecting again.',
                    );
                }

                if (user.isLoading || !user.data || !isAuthSet) {
                    return;
                }

                hasProcessedCallback.current = true;

                await apiService.generateRechargeTokensDataAndSaveinBQ(
                    code,
                    shop,
                );

                // Clean up localStorage
                localStorage.removeItem('pendingRechargeShop');

                await refetchUser();

                navigate('/storeSettings/integrations');
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'An error occurred',
                );
                console.error('Error in Recharge callback:', err);
                hasProcessedCallback.current = false;
            }
        };

        handleCallback();
    }, [code, user.isLoading, user.data, isAuthSet]);

    if (error) {
        console.error('Recharge callback error:', error);
    }

    return <PageSpinner />;
};

export default RechargeCallback;
