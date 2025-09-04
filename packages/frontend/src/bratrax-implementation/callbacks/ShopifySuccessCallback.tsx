import { useEffect, useRef } from 'react';
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

    // Use ref to track if callback has already been processed
    const hasProcessedCallback = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                console.log('🔍 Callback started', {
                    code: code.length,
                    shop: shop.length,
                });

                // Prevent double execution
                if (hasProcessedCallback.current) {
                    console.log('❌ Already processed, skipping');
                    return;
                }

                if (code.length === 0 || shop.length === 0) {
                    console.log('❌ Missing code or shop, redirecting');
                    // If incomplete data, navigate to projects
                    if (activeProjectUuid) {
                        navigate(`/projects/${activeProjectUuid}/home`);
                    } else {
                        navigate('/projects');
                    }
                    return;
                }

                if (user.isLoading) {
                    console.log('⏳ User still loading, waiting...');
                    // If user data is still loading, wait
                    return;
                }

                console.log('👤 User data:', {
                    hasData: !!user.data,
                    isLoading: user.isLoading,
                });

                if (user.data) {
                    // User is authenticated, proceed with the callback
                    if (isActiveProjectLoading) {
                        console.log('⏳ Project still loading, waiting...');
                        // Wait for project data to load
                        return;
                    }

                    console.log('✅ Starting API call...');
                    // Mark as processing to prevent double execution
                    hasProcessedCallback.current = true;

                    await apiService.generateShopifyTokensDataAndSaveinBQ(
                        code,
                        shop,
                    );
                    console.log('✅ API call completed');

                    // Refresh user data to update connection status
                    await refetchUser();
                    console.log('✅ User data refreshed');

                    // Navigate to the active project's home page
                    if (activeProjectUuid) {
                        navigate(`/projects/${activeProjectUuid}/home`);
                    } else {
                        // Fallback to projects list if no active project
                        navigate('/projects');
                    }
                    console.log('✅ Navigation completed');
                } else {
                    console.log(
                        '❌ User not authenticated, redirecting to login',
                    );
                    // User is not authenticated, save pending auth and redirect to login
                    localStorage.setItem(
                        'pendingShopifyAuth',
                        JSON.stringify({ code, shop }),
                    );
                    navigate('/login');
                }
            } catch (err) {
                console.error('❌ Error in Shopify Success callback:', err);
                // Reset the flag on error so user can retry
                hasProcessedCallback.current = false;
            }
        };

        handleCallback();
    }, [code, shop, user.isLoading, user.data]);

    return <PageSpinner />;
};

export default ShopifySuccessCallback;
