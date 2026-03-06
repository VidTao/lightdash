import { notifications } from '@mantine/notifications';
import { useGoogleLogin } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import { useRefetchUser } from '../../hooks/user/useRefetchUser';
import useApp from '../../providers/App/useApp';
import PlatformCard from '../cards/PlatformCard';
import { formatDate } from '../helpers/date';
import DisconnectConfirmModal from '../modals/DisconnectConfirmModal';
import { DisplayAdConnectionsData } from '../modals/DisplayAdConnectionsData';
import SelectAccountModal from '../modals/SelectAccountModal';
import { AdPlatformAccountInfo, AdvertisingConnection, PlatformConnection } from '../models/interfaces';
import { apiService } from '../services/api';

interface GoogleAdsConnectorProps {
    adConnections: AdvertisingConnection[];
    platformConnection: PlatformConnection | null;
    isLoading: boolean;
}

const GoogleAdsConnector = ({ 
    adConnections, 
    platformConnection, 
    isLoading: propsLoading 
}: GoogleAdsConnectorProps) => {
    const { user } = useApp();
    const refetchUser = useRefetchUser();
    const [googleUser, setGoogleUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isAccountsDataLoading, setIsAccountsDataLoading] = useState(false);
    const [accountsData, setAccountsData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAccounts, setSelectedAccounts] = useState<
        AdPlatformAccountInfo[]
    >([]);

    const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);
    const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);

    const handleDisconnect = async () => {
        try {
            await apiService.disconnectPlatform('Google');
            setIsDisconnectOpen(false);
            window.location.reload();
        } catch (error) {
            console.error('Error disconnecting:', error);
        }
    };

    useEffect(() => {
        if (googleUser) {
            const fetchData = async () => {
                try {
                    setIsAccountsDataLoading(true);
                    setIsModalOpen(true);
                    const res = await apiService.getAllGoogleManagerAccounts(
                        googleUser.code,
                    );
                    if (res.data) {
                        setAccountsData(processTreeData(res.data));
                        console.log(processTreeData(res.data));
                        setIsAccountsDataLoading(false);
                    }
                } catch (error) {
                    console.error(error);
                }
            };
            fetchData();
        }
    }, [googleUser]);

    useEffect(() => {
        if (selectedAccounts.length > 0) {
            const insertData = async () => {
                try {
                    const res =
                        await apiService.generateGoogleTokensDataAndSaveinBQ(
                            googleUser.code,
                            selectedAccounts,
                        );

                    localStorage.setItem(
                        'google_access_token',
                        res.access_token,
                    );
                    localStorage.setItem(
                        'account_id',
                        res.accounts_data[0].account_id,
                    );
                    localStorage.setItem(
                        'manager_id',
                        res.accounts_data[0].customer_manager_id,
                    );
                    refetchUser();
                    // fetchApplicationUser(); check if this is needed
                } catch (error) {
                    console.error(error);
                }
            };
            insertData();
        }
    }, [selectedAccounts]);

    const handleSuccess = (user: any) => {
        setIsLoading(false);
        setGoogleUser(user);
        console.log(user);
    };

    const handleError = (error: any) => {
        console.error(error);
    };

    const processTreeData = (data: any) =>
        data.map((item: any) => ({
            ...item,
            key: `${item.customer_id}-${item.manager_account_id}`,
            checkable: !item.is_manager_account,
            title: `${item.name} (${item.customer_id}), ${item.currency_code} - ${item.time_zone}`,
            children: item.children ? processTreeData(item.children) : [],
        }));

    const handleAccountsSettings = (
        selectedAccounts: AdPlatformAccountInfo[],
    ) => {
        console.log(selectedAccounts);
        setSelectedAccounts(selectedAccounts);
        setIsModalOpen(false);
    };

    const googleLogin = useGoogleLogin({
        onSuccess: handleSuccess,
        onError: handleError,
        scope: 'https://www.googleapis.com/auth/adwords',
        flow: 'auth-code',
    });

    return (
        <>
            <PlatformCard
                handleLogin={() => {
                    setIsLoading(true);
                    googleLogin();
                }}
                handleNavigate={() => {
                    setIsAdConnectionsOpen(true);
                }}
                isLoading={propsLoading || isLoading}
                connectedOn={formatDate(platformConnection?.created_at ?? '')}
                isConnected={!!platformConnection}
                platformName="Google ads"
                logoPath="google-ads-logo.svg"
                description="Connect your Google ads account to get started"
                onDisconnect={() => setIsDisconnectOpen(true)}
            />
            <SelectAccountModal
                modalTitle="Select google ads accounts:"
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
                platformName="Google Ads"
                isLoading={false}
            />
        </>
    );
};

export default GoogleAdsConnector;
