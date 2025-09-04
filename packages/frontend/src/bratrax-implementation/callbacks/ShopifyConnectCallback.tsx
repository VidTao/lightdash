import { useEffect } from 'react';
import PageSpinner from '../../components/PageSpinner';
import { useActiveProjectUuid } from '../../hooks/useActiveProject';
import useApp from '../../providers/App/useApp';
import useQueryParams from '../hooks/useQueryParams';
import { apiService } from '../services/api';

const ShopifyConnectCallback = () => {
    const { shop, hmac } = useQueryParams();
    const { user } = useApp();
    const { isLoading: isActiveProjectLoading, activeProjectUuid } =
        useActiveProjectUuid();

    useEffect(() => {
        const handleCallback = async () => {
            try {
                if (shop.length !== 0 && hmac.length !== 0) {
                    if (
                        user.isLoading ||
                        !user.data ||
                        isActiveProjectLoading
                    ) {
                        // If user data or project data is still loading, wait
                        return;
                    }

                    const shopAuthUrl = await apiService.getShopifyShopAuthUrl(
                        shop,
                    );
                    window.location.href = shopAuthUrl;
                }
            } catch (err) {
                console.error('Error in Shopify Connect callback:', err);
            }
        };

        handleCallback();
    }, [
        shop,
        hmac,
        user.isLoading,
        user.data,
        isActiveProjectLoading,
        activeProjectUuid,
    ]);

    return <PageSpinner />;
};

export default ShopifyConnectCallback;
