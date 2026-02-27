import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import { AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface LinkedInAdsConnectorProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const LinkedInAdsConnector = ({
    adConnections,
    platformConnection,
    isLoading: propsLoading,
}: LinkedInAdsConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const authUrl = await apiService.getLinkedInAdsAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting LinkedIn Ads auth URL:', error);
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
                platformName="LinkedIn Ads"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="linkedin-ads-logo.png"
                description="Connect your LinkedIn Ads account to import ad data"
            />
            <DisplayAdConnectionsData
                isOpen={isAdConnectionsOpen}
                onClose={() => setIsAdConnectionsOpen(false)}
                advertisingConnections={adConnections}
            />
        </>
    );
};
