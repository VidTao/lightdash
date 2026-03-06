import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import { AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface RedditAdsConnectorProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const RedditAdsConnector = ({
    adConnections,
    platformConnection,
    isLoading: propsLoading,
}: RedditAdsConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const authUrl = await apiService.getRedditAdsAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting Reddit Ads auth URL:', error);
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
                platformName="Reddit Ads"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="reddit-ads-logo.webp"
                description="Connect your Reddit Ads account to import campaign data"
            />
            <DisplayAdConnectionsData
                isOpen={isAdConnectionsOpen}
                onClose={() => setIsAdConnectionsOpen(false)}
                advertisingConnections={adConnections}
            />
        </>
    );
};
