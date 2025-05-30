import { apiService } from "../services/api";
import { useEffect, useState } from "react";

interface UseProductsCogsSettingsProps {
  selectedTabKey: string;
  selectedMarketplace: string;
}

export const useProductsCogsSettings = ({ selectedTabKey, selectedMarketplace }: UseProductsCogsSettingsProps) => {
  const [productsCogsSettings, setProductsCogsSettings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductsWithCogs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const platformType = selectedTabKey;
        const results = await apiService.getProductsWithCogsSettings(platformType, selectedMarketplace);

        if (results.success) {
          setProductsCogsSettings(results.data);
        } else {
          setError(results.error || "Failed to load product COGS settings");
        }
      } catch (error) {
        console.error("Error fetching products with COGS settings:", error);
        setError("Failed to load product COGS settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductsWithCogs();
  }, [selectedTabKey, selectedMarketplace]);

  const updateProductsCogsSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const platformType = selectedTabKey;
      const results = await apiService.updateProductCogsSettings(platformType, productsCogsSettings);

      if (results.success) {
        return true;
      } else {
        setError(results.error || "Failed to update product COGS settings");
        return false;
      }
    } catch (error) {
      console.error("Error updating products COGS settings:", error);
      setError("Failed to update product COGS settings");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    productsCogsSettings,
    setProductsCogsSettings,
    updateProductsCogsSettings,
    isLoading,
    error,
  };
};
