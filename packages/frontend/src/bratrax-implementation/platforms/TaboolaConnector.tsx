import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import { CrmConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface TaboolaConnectorProps {
    crmConnections: CrmConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const TaboolaConnector = ({ 
    crmConnections, 
    platformConnection, 
    isLoading: propsLoading 
}: TaboolaConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);

    const handleConnect = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.getTaboolaAuthUrl();
            window.location.href = response;
        } catch (error) {
            console.error('Error getting Taboola authentication:', error);
        } finally {
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
                platformName="Taboola"
                logoPath="taboola-logo.png"
                description="Connect your Taboola account to get started"
            />
            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections}
            />
        </>
    );
};

export default TaboolaConnector;
