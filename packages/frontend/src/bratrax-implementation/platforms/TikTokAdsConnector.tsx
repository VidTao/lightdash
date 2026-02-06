import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import { AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface TikTokAdsProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const TikTokAdsConnector = ({ 
    adConnections, 
    platformConnection, 
    isLoading: propsLoading 
}: TikTokAdsProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const authUrl = await apiService.getTikTokAdsAuthUrl();
            setIsLoading(false);
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting TikTok Ads auth URL:', error);
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
                platformName="TikTokAds"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="tiktok-logo.png"
                description="Connect your TikTok Ads account to get started"
            />
            <DisplayAdConnectionsData
                isOpen={isAdConnectionsOpen}
                onClose={() => setIsAdConnectionsOpen(false)}
                advertisingConnections={adConnections}
            />
        </>
    );
};
