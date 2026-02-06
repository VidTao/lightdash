import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const TikTokAdsCallback = () => {
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthSet } = useApp();
    const navigate = useNavigate();
    const refetchUser = useRefetchUser();
    const { code, state } = useQueryParams();

    // Use ref to track if callback has already been processed
    const hasProcessedCallback = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Prevent double execution
                if (hasProcessedCallback.current) {
                    return;
                }

                if (!code) {
                    throw new Error('No authorization code received');
                }

                if (user.isLoading || !user.data || !isAuthSet) {
                    // If user data is still loading or not available, wait
                    return;
                }

                // Mark as processing to prevent double execution
                hasProcessedCallback.current = true;

                // Exchange the code for tokens and save the data
                await apiService.generateTikTokAdsTokensDataAndSaveinBQ(
                    code,
                    state,
                );

                // Refresh user data to update connection status
                await refetchUser();

                // Redirect to integrations page
                navigate('/storeSettings/integrations');
                
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'An error occurred',
                );
                console.error('Error in TikTok Ads callback:', err);
                // Reset the flag on error so user can retry
                hasProcessedCallback.current = false;
            }
        };

        handleCallback();
    }, [code, state, user.isLoading, user.data, isAuthSet]);

    if (error) {
        console.error('TikTok Ads callback error:', error);
    }

    return <PageSpinner />;
};

export default TikTokAdsCallback;
