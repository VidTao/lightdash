import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import IterableApiKeyModal from '../modals/IterableApiKeyModal';
import { CrmConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface IterableConnectorProps {
    crmConnections: CrmConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const IterableConnector = ({
    crmConnections,
    platformConnection,
    isLoading: propsLoading,
}: IterableConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);

    const handleConnect = async (apiKey: string) => {
        try {
            setIsLoading(true);
            await apiService.connectIterable(apiKey);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error connecting Iterable:', error);
            notifications.show({
                title: 'Connection Failed',
                message: `Failed to connect: ${error || 'Unknown error'}`,
                color: 'red',
                radius: 'sm',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <PlatformCard
                handleLogin={() => setIsModalOpen(true)}
                handleNavigate={() => setIsCrmConnectionsOpen(true)}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                platformName="Iterable"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="iterable-logo.png"
                description="Connect your Iterable account to import email marketing data"
            />

            <IterableApiKeyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleConnect}
                isLoading={isLoading}
            />

            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections}
            />
        </>
    );
};
