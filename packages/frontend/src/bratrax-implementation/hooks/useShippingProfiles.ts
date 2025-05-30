import { apiService } from "../services/api";
import { useEffect, useState } from "react";
import { ShippingProfile } from "../models/interfaces";
import { message } from "antd";

export const useShippingProfiles = () => {
  const [shippingProfiles, setShippingProfiles] = useState<ShippingProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShippingProfiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const results = await apiService.getShippingProfiles();

      if (results.success) {
        setShippingProfiles(results.data);
      } else {
        setError(results.error || "Failed to fetch shipping profiles");
        message.error("Failed to fetch shipping profiles");
      }
    } catch (error) {
      console.error("Error fetching shipping profiles:", error);
      setError("Failed to fetch shipping profiles");
      message.error("Failed to fetch shipping profiles");
    } finally {
      setIsLoading(false);
    }
  };

  const updateShippingProfile = async (record: ShippingProfile) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.updateShippingProfile(record);

      if (response.success) {
        // Update the local state to reflect the changes
        setShippingProfiles((prevProfiles) =>
          prevProfiles.map((profile) => (profile.profileId === record.profileId ? record : profile))
        );

        message.success("Shipping profile updated successfully");
        return true;
      } else {
        setError(response.error || "Failed to update shipping profile");
        message.error(response.error || "Failed to update shipping profile");
        return false;
      }
    } catch (error) {
      console.error("Error updating shipping profile:", error);
      setError("Failed to update shipping profile");
      message.error("Failed to update shipping profile");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingProfiles();
  }, []);

  return {
    shippingProfiles,
    setShippingProfiles,
    fetchShippingProfiles,
    updateShippingProfile,
    isLoading,
    error,
  };
};
