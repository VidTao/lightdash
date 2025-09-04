import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const AmazonSpCallback = () => {
    const [error, setError] = useState<string | null>(null);
    const { user } = useApp();
    const navigate = useNavigate();
    const refetchUser = useRefetchUser();
    const { spApiAuthCode, sellingPartnerId } = useQueryParams();
    const { isLoading: isActiveProjectLoading, activeProjectUuid } =
        useActiveProjectUuid();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                if (!spApiAuthCode) {
                    throw new Error('No authorization code received');
                }

                if (user.isLoading || !user.data || isActiveProjectLoading) {
                    // If user data or project data is still loading, wait
                    return;
                }

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

                // Navigate to the active project's home page
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
                console.error('Error in Amazon SP callback:', err);
            }
        };

        handleCallback();
    }, [
        navigate,
        user.isLoading,
        user.data,
        isActiveProjectLoading,
        activeProjectUuid,
        spApiAuthCode,
        sellingPartnerId,
        refetchUser,
    ]);

    if (error) {
        // You might want to show an error state here instead of just the spinner
        console.error('Amazon SP callback error:', error);
    }

    return <PageSpinner />;
};

export default AmazonSpCallback;
