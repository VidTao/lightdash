import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const AmazonAdsCallback = () => {
    const [error, setError] = useState<string | null>(null);
    const { user } = useApp();
    const navigate = useNavigate();
    const refetchUser = useRefetchUser();
    const { code, state } = useQueryParams();
    const { isLoading: isActiveProjectLoading, activeProjectUuid } =
        useActiveProjectUuid();

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

                if (user.isLoading || !user.data) {
                    // If user data is still loading or not available, wait
                    return;
                }

                if (isActiveProjectLoading) {
                    // Wait for project data to load
                    return;
                }

                // Mark as processing to prevent double execution
                hasProcessedCallback.current = true;

                const region = sessionStorage.getItem('amazonConfig') ?? '';
                // Exchange the code for tokens and save the data
                await apiService.generateAmazonAdsTokensDataAndSaveinBQ(
                    code,
                    state,
                    region,
                );
                sessionStorage.removeItem('amazonConfig');

                // Refresh user data to update connection status
                await refetchUser();

                // Redirect to projects (dashboard equivalent in Lightdash)
                if (activeProjectUuid) {
                    navigate(`/projects/${activeProjectUuid}/home`);
                } else {
                    // Fallback to projects list if no active project
                    navigate('/projects');
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'An error occurred',
                );
                console.error('Error in Amazon callback:', err);
                // Reset the flag on error so user can retry
                hasProcessedCallback.current = false;
            }
        };

        handleCallback();
    }, [code, state, user.isLoading, user.data, isActiveProjectLoading]);

    if (error) {
        // You might want to show an error state here instead of just the spinner
        console.error('Amazon Ads callback error:', error);
    }

    return <PageSpinner />;
};

export default AmazonAdsCallback;
