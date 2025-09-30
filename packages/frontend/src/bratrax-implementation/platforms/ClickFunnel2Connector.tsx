import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface ClickFunnel2ConnectorProps {
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const ClickFunnel2Connector = ({ 
    platformConnection, 
    isLoading: propsLoading 
}: ClickFunnel2ConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const authUrl = await apiService.getClickFunnel2AuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting ClickFunnel2 auth URL:', error);
            setIsLoading(false);
        }
    };

    return (
        <PlatformCard
            handleLogin={handleLogin}
            isConnected={!!platformConnection}
            isLoading={propsLoading || isLoading}
            connectedOn={formatDate(platformConnection?.created_at ?? '')}
            platformName="ClickFunnel 2.0"
            logoPath="cf-logo.png"
            description="Connect your ClickFunnel 2.0 account to get started"
        />
    );
};

export default ClickFunnel2Connector;
