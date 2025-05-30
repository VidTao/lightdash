import { apiService } from "../services/api";
import { useState } from "react";
import PlatformCard from "../components/cards/PlatformCard";
import { usePlatformConnection } from "../hooks/usePlatformConnection";

const PinterestConnector = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { platformConnection } = usePlatformConnection({ platformName: "Pinterest", setIsLoading });

  const handleLogin = async () => {
    setIsLoading(true);
    const authUrl = await apiService.getPinterestAuthUrl();
    window.location.href = authUrl;
  };

  return (
    <PlatformCard
      handleLogin={handleLogin}
      isLoading={isLoading}
      isConnected={!!platformConnection}
      platformName="Pinterest"
      logoPath="pinterest-logo.png"
      description="Connect your Pinterest account to get started"
    />
  );
};

export default PinterestConnector;
