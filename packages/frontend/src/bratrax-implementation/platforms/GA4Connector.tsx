import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import { AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface GA4ConnectorProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const GA4Connector = ({
    adConnections,
    platformConnection,
    isLoading: propsLoading,
}: GA4ConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform('GA4');
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const authUrl = await apiService.getGA4AuthUrl();
            setIsLoading(false);
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting GA4 auth URL:', error);
            setIsLoading(false);
        }
    };

    return (
        <>
            <PlatformCard
                handleLogin={handleLogin}
                handleNavigate={() => {
                    setIsAdConnectionsOpen(true);
                }}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                platformName="Google Analytics 4"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="ga4-logo.webp"
                description="Connect your GA4 account to import analytics data"
                onDisconnect={() => setIsDisconnectOpen(true)}
            />
            <DisplayAdConnectionsData
                isOpen={isAdConnectionsOpen}
                onClose={() => setIsAdConnectionsOpen(false)}
                advertisingConnections={adConnections}
            />
            <DisconnectConfirmModal
                isOpen={isDisconnectOpen}
                onClose={() => setIsDisconnectOpen(false)}
                onConfirm={handleDisconnect}
                platformName="Google Analytics 4"
                isLoading={false}
            />
        </>
    );
};
