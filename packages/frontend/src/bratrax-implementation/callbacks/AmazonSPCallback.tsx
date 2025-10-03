import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const AmazonSpCallback = () => {
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthSet } = useApp();
    const navigate = useNavigate();
    const refetchUser = useRefetchUser();
    const { spApiAuthCode, sellingPartnerId } = useQueryParams();


    // Use ref to track if callback has already been processed
    const hasProcessedCallback = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Prevent double execution
                if (hasProcessedCallback.current) {
                    return;
                }

                if (!spApiAuthCode) {
                    throw new Error('No authorization code received');
                }

                if (user.isLoading || !user.data || !isAuthSet) {
                    // If user data is still loading or not available, wait
                    return;
                }

                // Mark as processing to prevent double execution
                hasProcessedCallback.current = true;

                // Get the stored config
                const region = sessionStorage.getItem('amazonConfig') ?? '';
                await apiService.generateAmazonTokensDataAndSaveinBQ(
                    spApiAuthCode,
                    region,
                    sellingPartnerId,
                );
                sessionStorage.removeItem('amazonConfig');

                // Refresh user data to update connection status
                await refetchUser();
                navigate('/storeSettings/integrations');

                
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'An error occurred',
                );
                console.error('Error in Amazon SP callback:', err);
                // Reset the flag on error so user can retry
                hasProcessedCallback.current = false;
            }
        };

        handleCallback();
    }, [
        spApiAuthCode,
        sellingPartnerId,
        user.isLoading,
        user.data,
        isAuthSet,
    ]);

    if (error) {
        // You might want to show an error state here instead of just the spinner
        console.error('Amazon SP callback error:', error);
    }

    return <PageSpinner />;
};

export default AmazonSpCallback;
