import { useState } from 'react';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import { DisplayCrmConnectionsData } from '../modals/DisplayCrmConnectionsData';
import { EnterRechargeShopUrl } from '../modals/EnterRechargeShopUrl';
import { CrmConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface RechargeConnectorProps {
    crmConnections: CrmConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const RechargeConnector = ({
    crmConnections,
    platformConnection,
    isLoading: propsLoading,
}: RechargeConnectorProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);

    const handleLogin = async () => {
        setIsLoading(true);
        setIsModalOpen(true);
    };

    const modalClosed = () => {
        setIsModalOpen(false);
        setIsLoading(false);
    };

    const modalSubmitted = async (shopUrl: string) => {
        try {
            // Save shop domain before redirect (Recharge callback doesn't include it)
            localStorage.setItem('pendingRechargeShop', shopUrl);
            const authUrl = await apiService.getRechargeShopAuthUrl(shopUrl);
            window.location.href = authUrl;
        } catch (error) {
            console.error('Error getting Recharge auth URL:', error);
            localStorage.removeItem('pendingRechargeShop');
            setIsLoading(false);
        }
    };

    return (
        <>
            <EnterRechargeShopUrl
                isOpen={isModalOpen}
                onClose={modalClosed}
                onSubmit={modalSubmitted}
            />
            <PlatformCard
                handleLogin={handleLogin}
                handleNavigate={() => {
                    setIsCrmConnectionsOpen(true);
                }}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                platformName="Recharge"
                logoPath="recharge-logo.png"
                description="Connect your Recharge account to import subscription data"
            />
            <DisplayCrmConnectionsData
                isOpen={isCrmConnectionsOpen}
                onClose={() => setIsCrmConnectionsOpen(false)}
                crmConnections={crmConnections}
            />
        </>
    );
};

export default RechargeConnector;
