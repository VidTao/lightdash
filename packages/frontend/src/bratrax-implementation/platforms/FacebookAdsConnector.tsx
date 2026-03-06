import { notifications } from '@mantine/notifications';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import SelectAccountModal from '../modals/SelectAccountModal';
import { AdPlatformAccountInfo, AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface FacebookAdsConnectorProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const FacebookAdsConnector = ({ 
    adConnections, 
    platformConnection, 
    isLoading: propsLoading 
}: FacebookAdsConnectorProps) => {
    const { user, health } = useApp();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [accountsData, setAccountsData] = useState([]);
    const [isAccountsDataLoading, setIsAccountsDataLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const refetchUser = useRefetchUser();
    const [selectedAccounts, setSelectedAccounts] = useState<
        AdPlatformAccountInfo[]
    >([]);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [accessToken, setAccessToken] = useState('');
    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform('Facebook');
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    useEffect(() => {
        if (selectedAccounts.length > 0) {
            const fetch = async () => {
                try {
                    console.log(selectedAccounts);
                    await apiService.generateFBTokensDataAndSaveinBQ(
                        accessToken,
                        userInfo.email,
                        selectedAccounts,
                    );
                    refetchUser();
                    setIsLoading(false);
                } catch (error) {
                    console.error(error);
                }
            };
            fetch();
        }
    }, [selectedAccounts]);

    const handleAccountsSettings = (
        selectedAccounts: AdPlatformAccountInfo[],
    ) => {
        setSelectedAccounts(selectedAccounts);
        console.log(selectedAccounts);
        setIsModalOpen(false);
    };
    
    const processTreeData = (data: any) =>
        data.map((item: any) => ({
            ...item,
            key: `${item.account_id}`,
            title: `${item.name} (${item.account_id})`, // Combine properties here
        }));
    
    // Function to handle login
    const handleLogin = async () => {
        setIsLoading(true);
        //initiate login
        const loginResponse = await apiService.fbLogin();
        setAccessToken(loginResponse.authResponse.accessToken);

        //get basic info(name, email)
        const userInfo = await apiService.getfbUserInfo();
        setUserInfo(userInfo);
        setIsAccountsDataLoading(true);
        setIsModalOpen(true);

        //get ad accounts data
        const adAccountsResponse = await apiService.getfbAdAccounts(
            accessToken,
        );
        console.log(adAccountsResponse);
        setIsAccountsDataLoading(false);
        setAccountsData(processTreeData(adAccountsResponse.data));
    };

    return (
        <>
            <PlatformCard
                handleLogin={handleLogin}
                handleNavigate={() => {
                    setIsAdConnectionsOpen(true);
                }}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                isLoading={propsLoading || isLoading}
                isConnected={!!platformConnection}
                platformName="Facebook"
                logoPath="fb-logo.webp"
                description="Connect your Facebook account to get started"
                onDisconnect={() => setIsDisconnectOpen(true)}
            />
            <SelectAccountModal
                modalTitle="Select facebook accounts:"
                isLoading={isAccountsDataLoading}
                isModalOpen={isModalOpen}
                accountsData={accountsData}
                handleOk={handleAccountsSettings}
                handleCancel={() => setIsModalOpen(false)}
            />
            <DisplayAdConnectionsData
                isOpen={isAdConnectionsOpen}
                onClose={() => setIsAdConnectionsOpen(false)}
                advertisingConnections={adConnections}
            />
            <DisconnectConfirmModal
                isOpen={isDisconnectOpen}
                onClose={() => setIsDisconnectOpen(false)}
                onConfirm={handleDisconnect}
                platformName="Facebook Ads"
                isLoading={false}
            />
        </>
    );
};

export default FacebookAdsConnector;
