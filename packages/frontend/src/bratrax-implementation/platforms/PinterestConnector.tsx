import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import { AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface PinterestConnectorProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const PinterestConnector = ({
    adConnections,
    platformConnection,
    isLoading: propsLoading,
}: PinterestConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const authUrl = await apiService.getPinterestAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting Pinterest auth URL:', error);
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
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                platformName="Pinterest"
                logoPath="pinterest-logo.png"
                description="Connect your Pinterest account to get started"
            />
            <DisplayAdConnectionsData
                isOpen={isAdConnectionsOpen}
                onClose={() => setIsAdConnectionsOpen(false)}
                advertisingConnections={adConnections}
            />
        </>
    );
};

export default PinterestConnector;
