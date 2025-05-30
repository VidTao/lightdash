import { useState } from "react";
import { apiService } from "../services/api";
import PlatformCard from "../components/cards/PlatformCard";
import { usePlatformConnection } from "../hooks/usePlatformConnection";
import { formatDate } from "../helpers/date";
import { useCrmConnections } from "../hooks/useCrmConnections";
import { DisplayCrmConnectionsData } from "../components/modals/DisplayCrmConnectionsData";

const TaboolaConnector = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { platformConnection } = usePlatformConnection({
    platformName: "Taboola",
    setIsLoading,
  });
  const { crmConnections } = useCrmConnections({ platformName: "Taboola", setIsLoading });
  const [isCrmConnectionsOpen, setIsCrmConnectionsOpen] = useState(false);

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getTaboolaAuthUrl();
      window.location.href = response;
    } catch (error) {
      console.error("Error getting Taboola authentication:", error);
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
        connectedOn={formatDate(platformConnection?.created_at ?? "")}
        isLoading={isLoading}
        isConnected={!!platformConnection}
        platformName="Taboola"
        logoPath="taboola-logo.png"
        description="Connect your Taboola account to get started"
      />
      <DisplayCrmConnectionsData
        isOpen={isCrmConnectionsOpen}
        onClose={() => setIsCrmConnectionsOpen(false)}
        crmConnections={crmConnections ?? []}
      />
    </>
  );
};

export default TaboolaConnector;
