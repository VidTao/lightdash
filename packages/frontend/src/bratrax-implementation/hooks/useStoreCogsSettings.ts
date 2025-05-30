import { useEffect, useState } from "react";
import { apiService } from "../services/api";
import { COGSSettings } from "../models/interfaces";

interface UseStoreCogsSettingsProps {
  selectedTabKey: string;
}

export const useStoreCogsSettings = ({ selectedTabKey }: UseStoreCogsSettingsProps) => {
  const [cogsSettings, setCogsSettings] = useState<COGSSettings>({
    enableCOGS: false,
    enableHandlingFee: false,
    handlingFee: 2,
    bidirectionalCOGS: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStoreCogsSettings = async () => {
      try {
        setIsLoading(true);
        const platformType = selectedTabKey;
        const settings = await apiService.getStoreCogsSettings(platformType);

        if (settings.success) {
          const data = settings.data;
          setCogsSettings({
            enableCOGS: data.enable_global_cogs,
            enableHandlingFee: data.enable_handling_fee,
            handlingFee: data.global_handling_fee || 0,
            bidirectionalCOGS: data.bidirectional_cogs,
          });
        }
        setError(null);
      } catch (error) {
        console.error("Error fetching store COGS settings:", error);
        setError("Failed to load COGS settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStoreCogsSettings();
  }, [selectedTabKey]);

  const updateStoreCogsSettings = async () => {
    try {
      setIsLoading(true);
      const platformType = selectedTabKey;
      const response = await apiService.updateStoreCogsSettings(platformType, cogsSettings);

      if (response.success) {
        setError(null);
        return true;
      } else {
        setError("Failed to update COGS settings");
        return false;
      }
    } catch (error) {
      console.error("Error updating store COGS settings:", error);
      setError("Failed to update COGS settings");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cogsSettings,
    setCogsSettings,
    updateStoreCogsSettings,
    isLoading,
    error,
  };
};
