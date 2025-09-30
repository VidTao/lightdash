import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface PinterestConnectorProps {
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const PinterestConnector = ({ 
    platformConnection, 
    isLoading: propsLoading 
}: PinterestConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);

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
        <PlatformCard
            handleLogin={handleLogin}
            isLoading={propsLoading || isLoading}
            isConnected={!!platformConnection}
            connectedOn={formatDate(platformConnection?.created_at ?? '')}
            platformName="Pinterest"
            logoPath="pinterest-logo.png"
            description="Connect your Pinterest account to get started"
        />
    );
};

export default PinterestConnector;
