import { useState } from 'react';
import { useNavigate } from 'react-router';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { useCrmConnections } from '../hooks/useCrmConnections';
import { usePlatformConnection } from '../hooks/usePlatformConnection';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import { apiService } from '../services/api';

interface AmazonSpProps {
    region: string;
}

export const AmazonSPConnector = ({ region }: AmazonSpProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { platformConnection } = usePlatformConnection({
        platformName: `AmazonSP-${region.toUpperCase()}`,
        setIsLoading,
    });
    const { crmConnections } = useCrmConnections({
        platformName: `AmazonSP-${region.toUpperCase()}`,
        setIsLoading,
    });
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);
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
                isLoading={isLoading}
                isConnected={!!platformConnection}
                platformName={`Amazon SP (${region.toUpperCase()})`}
                logoPath="amazon-logo.jpg"
                description="Connect your Amazon Seller account to get started"
            />
            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections ?? []}
            />
        </>
    );
};
