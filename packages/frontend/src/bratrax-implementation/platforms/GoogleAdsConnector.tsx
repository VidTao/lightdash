import { useGoogleLogin } from "@react-oauth/google";
import { useEffect, useState } from "react";
import { apiService } from "../services/api";
import SelectAccountModal from "../components/modals/SelectAccountModal";
import PlatformCard from "../components/cards/PlatformCard";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import { AdPlatformAccountInfo } from "../models/interfaces";
import { usePlatformConnection } from "../hooks/usePlatformConnection";
import { formatDate } from "../helpers/date";
import { useAdConnections } from "../hooks/useAdConnections";
import { DisplayAdConnectionsData } from "../components/modals/DisplayAdConnectionsData";

const GoogleAdsConnector = () => {
  const { fetchApplicationUser } = useAuth();
  const { setIsLoading: setIsLoadingState } = useLoading();
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountsDataLoading, setIsAccountsDataLoading] = useState(false);
  const [accountsData, setAccountsData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<AdPlatformAccountInfo[]>([]);
  const { platformConnection } = usePlatformConnection({ platformName: "Google", setIsLoading });
  const { adConnections } = useAdConnections({ platformName: "Google", setIsLoading });
  const [isAdConnectionsOpen, setIsAdConnectionsOpen] = useState(false);

  useEffect(() => {
    if (googleUser) {
      const fetchData = async () => {
        try {
          setIsAccountsDataLoading(true);
          setIsModalOpen(true);
          const res = await apiService.getAllGoogleManagerAccounts(googleUser.code);
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
          setIsLoadingState(true);
          const res = await apiService.generateGoogleTokensDataAndSaveinBQ(googleUser.code, selectedAccounts);

          localStorage.setItem("google_access_token", res.access_token);
          localStorage.setItem("account_id", res.accounts_data[0].account_id);
          localStorage.setItem("manager_id", res.accounts_data[0].customer_manager_id);

          fetchApplicationUser();
          setIsLoadingState(false);
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

  const handleAccountsSettings = (selectedAccounts: AdPlatformAccountInfo[]) => {
    console.log(selectedAccounts);
    setSelectedAccounts(selectedAccounts);
    setIsModalOpen(false);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleSuccess,
    onError: handleError,
    scope: "https://www.googleapis.com/auth/adwords",
    flow: "auth-code",
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
        isLoading={isLoading}
        connectedOn={formatDate(platformConnection?.created_at ?? "")}
        isConnected={false}
        platformName="Google ads"
        logoPath="google-ads-logo.svg"
        description="Connect your Google ads account to get started"
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
        advertisingConnections={adConnections ?? []}
      />
    </>
  );
};

export default GoogleAdsConnector;
