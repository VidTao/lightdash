import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const StripeCallback = () => {
    const { code } = useQueryParams();
    const navigate = useNavigate();
    const { user } = useApp();
    const refetchUser = useRefetchUser();
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

                if (code.length === 0) {
                    // If no code, navigate to projects
                    if (activeProjectUuid) {
                        navigate(`/projects/${activeProjectUuid}/home`);
                    } else {
                        navigate('/projects');
                    }
                    return;
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

                await apiService.generateStripeTokensDataAndSaveinBQ(code);

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
                console.error('Error in Stripe callback:', err);
                // Reset the flag on error so user can retry
                hasProcessedCallback.current = false;
            }
        };

        handleCallback();
    }, [code, user.isLoading, user.data]);

    return <PageSpinner />;
};

export default StripeCallback;
