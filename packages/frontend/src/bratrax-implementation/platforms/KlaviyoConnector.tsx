import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { usePlatformConnection } from '../hooks/usePlatformConnection';
import { apiService } from '../services/api';

const KlaviyoConnector = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { platformConnection } = usePlatformConnection({
        platformName: 'Klaviyo',
        setIsLoading,
    });

    const handleLogin = async () => {
        setIsLoading(true);
        const authUrl = await apiService.getKlaviyoAuthUrl();
        window.location.href = authUrl;
    };

    return (
        <PlatformCard
            handleLogin={handleLogin}
            isLoading={isLoading}
            isConnected={!!platformConnection}
            platformName="Klaviyo"
            logoPath="klaviyo-logo.png"
            description="Connect your Klaviyo account to get started"
        />
    );
};

export default KlaviyoConnector;
