import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { useCrmConnections } from '../hooks/useCrmConnections';
import { usePlatformConnection } from '../hooks/usePlatformConnection';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import { EnterShopifyShopUrl } from '../modals/EnterShopifyShopUrl';
import { apiService } from '../services/api';
const ShopifyConnector = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { platformConnection } = usePlatformConnection({
        platformName: 'Shopify',
        setIsLoading,
    });
    const { crmConnections } = useCrmConnections({
        platformName: 'Shopify',
        setIsLoading,
    });
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        setIsModalOpen(true);
    };

    const modalClosed = () => {
        setIsModalOpen(false);
        setIsLoading(false);
    };

    const modalSubmitted = async (shopUrl: string) => {
        const shopAuthUrl = await apiService.getShopifyShopAuthUrl(shopUrl);
        window.location.href = shopAuthUrl;
    };

    return (
        <>
            <EnterShopifyShopUrl
                isOpen={isModalOpen}
                onClose={modalClosed}
                onSubmit={modalSubmitted}
            />
            <PlatformCard
                handleLogin={handleLogin}
                handleNavigate={() => {
                    setIsCrmConnectionsOpen(true);
                }}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                isLoading={isLoading}
                isConnected={false}
                platformName="Shopify"
                logoPath="shopify-logo.webp"
                description="Connect your Shopify account to get started"
            />
            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections ?? []}
            />
        </>
    );
};

export default ShopifyConnector;
