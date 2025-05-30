import { useState } from "react";
import { apiService } from "../services/api";
import PlatformCard from "../components/cards/PlatformCard";
import { usePlatformConnection } from "../hooks/usePlatformConnection";
import { formatDate } from "../helpers/date";
import { useCrmConnections } from "../hooks/useCrmConnections";
import { DisplayCrmConnectionsData } from "../components/modals/DisplayCrmConnectionsData";
import OutbrainLoginModal from "../components/modals/OutbrainLoginModal";
import { message } from "antd";

const OutbrainConnector = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { platformConnection } = usePlatformConnection({
    platformName: "Outbrain",
    setIsLoading,
  });
  const { crmConnections } = useCrmConnections({ platformName: "Outbrain", setIsLoading });
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
      const response = await apiService.generateAndInsertOutbrainToken(encodedAuth);
    } catch (error) {
      console.error("Error during Outbrain authentication:", error);
      message.error("Failed to connect: " + (error || "Unknown error"));
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
        connectedOn={formatDate(platformConnection?.created_at ?? "")}
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
