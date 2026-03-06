import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import { AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface AmazonAdsProps {
    region: string;
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const AmazonAdsConnector = ({ 
    region, 
    adConnections, 
    platformConnection, 
    isLoading: propsLoading 
}: AmazonAdsProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform(`AmazonAds-${region.toUpperCase()}`);
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            sessionStorage.setItem('amazonConfig', region.toUpperCase());
            const authUrl = await apiService.getAmazonAdsAuthUrl(region);
            setIsLoading(false);
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting Amazon Ads auth URL:', error);
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
                platformName={`Amazon Ads (${region.toUpperCase()})`}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="amazon-ads-logo.png"
                description="Connect your Amazon Ads account to get started"
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
                platformName={`Amazon Ads (${region.toUpperCase()})`}
                isLoading={false}
            />
        </>
    );
};
