import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { usePlatformConnection } from '../hooks/usePlatformConnection';
import { apiService } from '../services/api';

const GoHighLevelConnector = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { platformConnection } = usePlatformConnection({
        platformName: 'GoHighLevel',
        setIsLoading,
    });

    const handleLogin = async () => {
        setIsLoading(true);
        const authUrl = await apiService.getGoHighLevelAuthUrl();
        window.location.href = authUrl.toString();
    };

    return (
        <PlatformCard
            handleLogin={handleLogin}
            isLoading={isLoading}
            isConnected={!!platformConnection}
            platformName="GoHighLevel"
            logoPath="ghl-logo.svg"
            description="Connect your GoHighLevel account to get started"
        />
    );
};

export default GoHighLevelConnector;
