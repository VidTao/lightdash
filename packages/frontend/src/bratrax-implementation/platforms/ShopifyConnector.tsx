import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import { EnterShopifyShopUrl } from '../modals/EnterShopifyShopUrl';
import { CrmConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface ShopifyConnectorProps {
    crmConnections: CrmConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const ShopifyConnector = ({ 
    crmConnections, 
    platformConnection, 
    isLoading: propsLoading 
}: ShopifyConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
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
        try {
            const shopAuthUrl = await apiService.getShopifyShopAuthUrl(shopUrl);
            window.location.href = shopAuthUrl;
        } catch (error) {
            console.error('Error getting Shopify shop auth URL:', error);
            setIsLoading(false);
        }
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
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                platformName="Shopify"
                logoPath="shopify-logo.webp"
                description="Connect your Shopify account to get started"
            />
            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections}
            />
        </>
    );
};

export default ShopifyConnector;
