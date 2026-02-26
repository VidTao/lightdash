import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import { AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface BingAdsConnectorProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const BingAdsConnector = ({
    adConnections,
    platformConnection,
    isLoading: propsLoading,
}: BingAdsConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const authUrl = await apiService.getBingAdsAuthUrl();
            setIsLoading(false);
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting Bing Ads auth URL:', error);
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
                platformName="Bing Ads"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="bing-ads-logo.png"
                description="Connect your Microsoft Advertising account to import ads data"
            />
            <DisplayAdConnectionsData
                isOpen={isAdConnectionsOpen}
                onClose={() => setIsAdConnectionsOpen(false)}
                advertisingConnections={adConnections}
            />
        </>
    );
};
