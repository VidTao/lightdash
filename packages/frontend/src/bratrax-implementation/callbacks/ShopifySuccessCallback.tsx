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
    const { user, isAuthSet } = useApp();
    const navigate = useNavigate();
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

                if (code.length === 0 || shop.length === 0) {
                    // If incomplete data, navigate to projects
                    return;
                }

                if (user.isLoading || !user.data || !isAuthSet) {
                    // If user data is still loading, wait
                    return;
                }

                if (user.data) {
                    // Mark as processing to prevent double execution
                    hasProcessedCallback.current = true;

                    await apiService.generateShopifyTokensDataAndSaveinBQ(
                        code,
                        shop,
                    );

                    // Refresh user data to update connection status
                    await refetchUser();

                    // Navigate to the active project's home page
                    navigate('/storeSettings/integrations');
                } else {
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
    }, [code, shop, user.isLoading, user.data, isAuthSet]);

    return <PageSpinner />;
};

export default ShopifySuccessCallback;
