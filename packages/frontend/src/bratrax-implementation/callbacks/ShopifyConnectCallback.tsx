import { useEffect, useRef } from 'react';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const ShopifyConnectCallback = () => {
    const { shop, hmac } = useQueryParams();
    const { user, isAuthSet } = useApp();


    // Use ref to track if callback has already been processed
    const hasProcessedCallback = useRef(false);

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Prevent double execution
                if (hasProcessedCallback.current) {
                    return;
                }

                if (shop.length !== 0 && hmac.length !== 0) {
                    if (user.isLoading || !user.data || !isAuthSet) {
                        // If user data is still loading, wait
                        return;
                    }

                    // Mark as processing to prevent double execution
                    hasProcessedCallback.current = true;

                    const shopAuthUrl = await apiService.getShopifyShopAuthUrl(
                        shop,
                    );
                    window.location.href = shopAuthUrl;
                }
            } catch (err) {
                console.error('Error in Shopify Connect callback:', err);
                // Reset the flag on error so user can retry
                hasProcessedCallback.current = false;
            }
        };

        handleCallback();
    }, [shop, hmac, user.isLoading, user.data, isAuthSet]);

    return <PageSpinner />;
};

export default ShopifyConnectCallback;
