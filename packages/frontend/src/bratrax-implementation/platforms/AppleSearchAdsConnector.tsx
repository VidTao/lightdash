import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import AppleSearchAdsModal from '../modals/AppleSearchAdsModal';
import { AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface AppleSearchAdsConnectorProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const AppleSearchAdsConnector = ({
    adConnections,
    platformConnection,
    isLoading: propsLoading,
}: AppleSearchAdsConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform('AppleSearchAds');
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const handleConnect = async (
        clientId: string,
        teamId: string,
        keyId: string,
        privateKey: string,
    ) => {
        try {
            setIsLoading(true);
            await apiService.connectAppleSearchAds(clientId, teamId, keyId, privateKey);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error connecting Apple Search Ads:', error);
            notifications.show({
                title: 'Connection Failed',
                message: `Failed to connect: ${error || 'Unknown error'}`,
                color: 'red',
                radius: 'sm',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PlatformCard
                handleLogin={() => setIsModalOpen(true)}
                handleNavigate={() => setIsAdConnectionsOpen(true)}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                platformName="Apple Search Ads"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="apple-search-ads-logo.png"
                description="Connect your Apple Search Ads account to import campaign data"
                onDisconnect={() => setIsDisconnectOpen(true)}
            />

            <AppleSearchAdsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleConnect}
                isLoading={isLoading}
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
                platformName="Apple Search Ads"
                isLoading={false}
            />
        </>
    );
};
