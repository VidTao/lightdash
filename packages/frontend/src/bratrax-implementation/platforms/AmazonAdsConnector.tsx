import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { useAdConnections } from '../hooks/useAdConnections';
import { usePlatformConnection } from '../hooks/usePlatformConnection';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import { apiService } from '../services/api';

interface AmazonAdsProps {
    region: string;
}

export const AmazonAdsConnector = ({ region }: AmazonAdsProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const { platformConnection } = usePlatformConnection({
        platformName: `AmazonAds-${region.toUpperCase()}`,
        setIsLoading,
    });
    const { adConnections } = useAdConnections({
        platformName: `AmazonAds-${region.toUpperCase()}`,
        setIsLoading,
    });
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);
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
                isLoading={isLoading}
                isConnected={!!platformConnection}
                platformName={`Amazon Ads (${region.toUpperCase()})`}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="amazon-ads-logo.png"
                description="Connect your Amazon Ads account to get started"
            />
            <DisplayAdConnectionsData
                isOpen={isAdConnectionsOpen}
                onClose={() => setIsAdConnectionsOpen(false)}
                advertisingConnections={adConnections ?? []}
            />
        </>
    );
};
