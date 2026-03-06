import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import { PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface KlaviyoConnectorProps {
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const KlaviyoConnector = ({ 
    platformConnection, 
    isLoading: propsLoading 
}: KlaviyoConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform('Klaviyo');
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const authUrl = await apiService.getKlaviyoAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting Klaviyo auth URL:', error);
            setIsLoading(false);
        }
    };

    return (
        <>
            <PlatformCard
                handleLogin={handleLogin}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                platformName="Klaviyo"
                logoPath="klaviyo-logo.png"
                description="Connect your Klaviyo account to get started"
                onDisconnect={() => setIsDisconnectOpen(true)}
            />
            <DisconnectConfirmModal
                isOpen={isDisconnectOpen}
                onClose={() => setIsDisconnectOpen(false)}
                onConfirm={handleDisconnect}
                platformName="Klaviyo"
                isLoading={false}
            />
        </>
    );
};

export default KlaviyoConnector;
