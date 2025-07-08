import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { usePlatformConnection } from '../hooks/usePlatformConnection';
import { apiService } from '../services/api';

const ClickFunnel2Connector = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { platformConnection } = usePlatformConnection({
        platformName: 'ClickFunnel2',
        setIsLoading,
    });
    const handleLogin = async () => {
        setIsLoading(true);
        const authUrl = await apiService.getClickFunnel2AuthUrl();
        window.location.href = authUrl;
    };

    return (
        <PlatformCard
            handleLogin={handleLogin}
            isConnected={!!platformConnection}
            isLoading={isLoading}
            platformName="ClickFunnel 2.0"
            logoPath="cf-logo.png"
            description="Connect your ClickFunnel 2.0 account to get started"
        />
    );
};

export default ClickFunnel2Connector;
