import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const ShopifySuccessCallback = () => {
    const { code, shop } = useQueryParams();
    const { user } = useApp();
    const navigate = useNavigate();
    const refetchUser = useRefetchUser();
    const { isLoading: isActiveProjectLoading, activeProjectUuid } =
        useActiveProjectUuid();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                if (code.length === 0 || shop.length === 0) {
                    // If incomplete data, navigate to projects
                    if (activeProjectUuid) {
                        navigate(`/projects/${activeProjectUuid}/home`);
                    } else {
                        navigate('/projects');
                    }
                    return;
                }

                if (user.isLoading) {
                    // If user data is still loading, wait
                    return;
                }

                if (user.data) {
                    // User is authenticated, proceed with the callback
                    if (isActiveProjectLoading) {
                        // Wait for project data to load
                        return;
                    }

                    await apiService.generateShopifyTokensDataAndSaveinBQ(
                        code,
                        shop,
                    );

                    // Refresh user data to update connection status
                    await refetchUser();

                    // Navigate to the active project's home page
                    if (activeProjectUuid) {
                        navigate(`/projects/${activeProjectUuid}/home`);
                    } else {
                        // Fallback to projects list if no active project
                        navigate('/projects');
                    }
                } else {
                    // User is not authenticated, save pending auth and redirect to login
                    localStorage.setItem(
                        'pendingShopifyAuth',
                        JSON.stringify({ code, shop }),
                    );
                    navigate('/login');
                }
            } catch (err) {
                console.error('Error in Shopify Success callback:', err);
            }
        };

        handleCallback();
    }, [
        code,
        shop,
        user.isLoading,
        user.data,
        isActiveProjectLoading,
        activeProjectUuid,
        navigate,
        refetchUser,
    ]);

    return <PageSpinner />;
};

export default ShopifySuccessCallback;
