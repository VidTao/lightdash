import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import { CrmConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface HubSpotConnectorProps {
    crmConnections: CrmConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const HubSpotConnector = ({
    crmConnections,
    platformConnection,
    isLoading: propsLoading,
}: HubSpotConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const authUrl = await apiService.getHubSpotAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting HubSpot auth URL:', error);
            setIsLoading(false);
        }
    };

    return (
        <>
            <PlatformCard
                handleLogin={handleLogin}
                handleNavigate={() => {
                    setIsCrmConnectionsOpen(true);
                }}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                platformName="HubSpot"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="hubspot-logo.png"
                description="Connect your HubSpot account to import CRM data"
            />
            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections}
            />
        </>
    );
};
