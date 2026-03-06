import { useState } from 'react';
import { useNavigate } from 'react-router';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import { CrmConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface AmazonSpProps {
    region: string;
    crmConnections: CrmConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const AmazonSPConnector = ({ 
    region, 
    crmConnections, 
    platformConnection, 
    isLoading: propsLoading 
}: AmazonSpProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform(`AmazonSP-${region.toUpperCase()}`);
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const handleConnect = async () => {
        try {
            setIsLoading(true);
            sessionStorage.setItem('amazonConfig', region.toUpperCase());
            const amazonAuthUrl = await apiService.getAmazonAuthUrl(region);
            setIsLoading(false);

            // Redirect to Amazon auth
            window.location.href = amazonAuthUrl;
        } catch (error) {
            console.error('Error during Amazon authentication:', error);
            setIsLoading(false);
        }
    };

    return (
        <>
            <PlatformCard
                handleLogin={handleConnect}
                handleNavigate={() => {
                    setIsCrmConnectionsOpen(true);
                }}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                platformName={`Amazon SP (${region.toUpperCase()})`}
                logoPath="amazon-logo.jpg"
                description="Connect your Amazon Seller account to get started"
                onDisconnect={() => setIsDisconnectOpen(true)}
            />
            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections}
            />
            <DisconnectConfirmModal
                isOpen={isDisconnectOpen}
                onClose={() => setIsDisconnectOpen(false)}
                onConfirm={handleDisconnect}
                platformName={`Amazon SP (${region.toUpperCase()})`}
                isLoading={false}
            />
        </>
    );
};
