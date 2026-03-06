import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
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
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform('ClickFunnel2');
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

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
        <>
            <PlatformCard
                handleLogin={handleLogin}
                isConnected={!!platformConnection}
                isLoading={propsLoading || isLoading}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                platformName="ClickFunnel 2.0"
                logoPath="cf-logo.png"
                description="Connect your ClickFunnel 2.0 account to get started"
                onDisconnect={() => setIsDisconnectOpen(true)}
            />
            <DisconnectConfirmModal
                isOpen={isDisconnectOpen}
                onClose={() => setIsDisconnectOpen(false)}
                onConfirm={handleDisconnect}
                platformName="ClickFunnels"
                isLoading={false}
            />
        </>
    );
};

export default ClickFunnel2Connector;
