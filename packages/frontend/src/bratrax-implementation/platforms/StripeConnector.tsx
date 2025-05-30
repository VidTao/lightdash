import useQueryParams from "../hooks/useQueryParams";
import { useEffect, useState } from "react";
import { apiService } from "../services/api";
import PlatformCard from "../components/cards/PlatformCard";
import { usePlatformConnection } from "../hooks/usePlatformConnection";

const StripeConnector = () => {
  const { code, shop } = useQueryParams();
  const [isLoading, setIsLoading] = useState(true);
  const { platformConnection } = usePlatformConnection({ platformName: "Stripe", setIsLoading });

  const handleLogin = async () => {
    setIsLoading(true);
    const authUrl = await apiService.getStripeAuthUrl();
    window.location.href = authUrl;
  };

  useEffect(() => {
    if (code.length > 0 && shop.length > 0) {
      const fetch = async () => {
        // const shopAuthUrl = await apiService.getShopifyShopAuthUrl(shop, state);
        // window.location.href = shopAuthUrl;
      };
      fetch();
    }
  }, [code, shop]);

  return (
    <PlatformCard
      handleLogin={handleLogin}
      isLoading={isLoading}
      isConnected={!!platformConnection}
      platformName="Stripe"
      logoPath="stripe-logo.webp"
      description="Connect your Stripe account to get started"
    />
  );
};

export default StripeConnector;
