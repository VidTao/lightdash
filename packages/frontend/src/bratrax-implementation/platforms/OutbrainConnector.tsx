import { notifications } from '@mantine/notifications';
import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { useCrmConnections } from '../hooks/useCrmConnections';
import { usePlatformConnection } from '../hooks/usePlatformConnection';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import OutbrainLoginModal from '../modals/OutbrainLoginModal';
import { apiService } from '../services/api';

const OutbrainConnector = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { platformConnection } = usePlatformConnection({
        platformName: 'Outbrain',
        setIsLoading,
    });
    const { crmConnections } = useCrmConnections({
        platformName: 'Outbrain',
        setIsLoading,
    });
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleConnect = async (encodedAuth: string) => {
        try {
            setIsLoading(true);
            await apiService.generateAndInsertOutbrainToken(encodedAuth);
        } catch (error) {
            console.error('Error during Outbrain authentication:', error);
            notifications.show({
                title: 'Connection Failed',
                message: `Failed to connect: ${error || 'Unknown error'}`,
                color: 'red',
                radius: 'sm',
            });
        } finally {
            setIsModalOpen(false);
            setIsLoading(false);
        }
    };

    return (
        <>
            <PlatformCard
                handleLogin={handleOpenModal}
                handleNavigate={() => {
                    setIsCrmConnectionsOpen(true);
                }}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                isLoading={isLoading}
                isConnected={!!platformConnection}
                platformName="Outbrain"
                logoPath="outbrain-logo.png"
                description="Connect your Outbrain account to get started"
            />

            <OutbrainLoginModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleConnect}
                isLoading={isLoading}
            />

            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections ?? []}
            />
        </>
    );
};

export default OutbrainConnector;
