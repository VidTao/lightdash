import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import { CrmConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface MailchimpConnectorProps {
    crmConnections: CrmConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

export const MailchimpConnector = ({
    crmConnections,
    platformConnection,
    isLoading: propsLoading,
}: MailchimpConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform('Mailchimp');
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    const handleLogin = async () => {
        try {
            setIsLoading(true);
            const authUrl = await apiService.getMailchimpAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting Mailchimp auth URL:', error);
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
                platformName="Mailchimp"
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                logoPath="mailchimp-logo.png"
                description="Connect your Mailchimp account to import email marketing data"
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
                platformName="Mailchimp"
                isLoading={false}
            />
        </>
    );
};
