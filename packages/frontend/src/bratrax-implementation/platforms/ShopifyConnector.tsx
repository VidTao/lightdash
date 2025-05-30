import { useState } from "react";
import { apiService } from "../services/api";
import PlatformCard from "../components/cards/PlatformCard";
import { EnterShopifyShopUrl } from "../components/modals/EnterShopifyShopUrl";
import { usePlatformConnection } from "../hooks/usePlatformConnection";
import { formatDate } from "../helpers/date";
import { DisplayCrmConnectionsData } from "../components/modals/DisplayCrmConnectionsData";
import { useCrmConnections } from "../hooks/useCrmConnections";
const ShopifyConnector = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { platformConnection } = usePlatformConnection({ platformName: "Shopify", setIsLoading });
  const { crmConnections } = useCrmConnections({ platformName: "Shopify", setIsLoading });
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
    const shopAuthUrl = await apiService.getShopifyShopAuthUrl(shopUrl);
    window.location.href = shopAuthUrl;
  };

  return (
    <>
      <EnterShopifyShopUrl isOpen={isModalOpen} onClose={modalClosed} onSubmit={modalSubmitted} />
      <PlatformCard
        handleLogin={handleLogin}
        handleNavigate={() => {
          setIsCrmConnectionsOpen(true);
        }}
        connectedOn={formatDate(platformConnection?.created_at ?? "")}
        isLoading={isLoading}
        isConnected={false}
        platformName="Shopify"
        logoPath="shopify-logo.webp"
        description="Connect your Shopify account to get started"
      />
      <DisplayCrmConnectionsData
        isOpen={isCrmConnectionsOpen}
        onClose={() => setIsCrmConnectionsOpen(false)}
        crmConnections={crmConnections ?? []}
      />
    </>
  );
};

export default ShopifyConnector;
