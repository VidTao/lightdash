import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const PinterestCallback = () => {
    const { code } = useQueryParams();
    const navigate = useNavigate();
    const { user, isAuthSet } = useApp();
    const refetchUser = useRefetchUser();

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
                    return;
                }

                if (user.isLoading || !user.data || !isAuthSet) {
                    // If user data is still loading or not available, wait
                    return;
                }

                // Mark as processing to prevent double execution
                hasProcessedCallback.current = true;

                await apiService.generatePinterestTokensDataAndSaveinBQ(code);

                // Refresh user data to update connection status
                await refetchUser();

                // Navigate to the active project's home page
                navigate('/storeSettings/integrations');
                
            } catch (err) {
                console.error('Error in Pinterest callback:', err);
                // Reset the flag on error so user can retry
                hasProcessedCallback.current = false;
            }
        };

        handleCallback();
    }, [code, user.isLoading, user.data, isAuthSet]);

    return <PageSpinner />;
};

export default PinterestCallback;
