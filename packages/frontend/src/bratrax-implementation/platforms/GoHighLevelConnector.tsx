import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface GoHighLevelConnectorProps {
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const GoHighLevelConnector = ({ 
    platformConnection, 
    isLoading: propsLoading 
}: GoHighLevelConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const authUrl = await apiService.getGoHighLevelAuthUrl();
            window.location.href = authUrl.toString();
        } catch (error) {
            console.error('Error getting GoHighLevel auth URL:', error);
            setIsLoading(false);
        }
    };

    return (
        <PlatformCard
            handleLogin={handleLogin}
            isLoading={propsLoading || isLoading}
            isConnected={!!platformConnection}
            connectedOn={formatDate(platformConnection?.created_at ?? '')}
            platformName="GoHighLevel"
            logoPath="ghl-logo.svg"
            description="Connect your GoHighLevel account to get started"
        />
    );
};

export default GoHighLevelConnector;
