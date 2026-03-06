import { useEffect, useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import useQueryParams from '../hooks/useQueryParams';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import { PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface StripeConnectorProps {
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const StripeConnector = ({ 
    platformConnection, 
    isLoading: propsLoading 
}: StripeConnectorProps) => {
    const { code, shop } = useQueryParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform('Stripe');
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const authUrl = await apiService.getStripeAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting Stripe auth URL:', error);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (code.length > 0 && shop.length > 0) {
            const fetch = async () => {
                // const shopAuthUrl = await apiService.getShopifyShopAuthUrl(shop, state);
                // window.location.href = shopAuthUrl;
            };
            fetch();
        }
    }, [code, shop]);

    return (
        <>
            <PlatformCard
                handleLogin={handleLogin}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                platformName="Stripe"
                logoPath="stripe-logo.webp"
                description="Connect your Stripe account to get started"
                onDisconnect={() => setIsDisconnectOpen(true)}
            />
            <DisconnectConfirmModal
                isOpen={isDisconnectOpen}
                onClose={() => setIsDisconnectOpen(false)}
                onConfirm={handleDisconnect}
                platformName="Stripe"
                isLoading={false}
            />
        </>
    );
};

export default StripeConnector;
