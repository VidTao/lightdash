import { useEffect } from "react";

import { useState } from "react";
import { AdvertisingConnection } from "../models/interfaces";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface useAdConnectionsProps {
    platformName: string;
    setIsLoading: (isLoading: boolean) => void;
}

export const useAdConnections = ({ platformName, setIsLoading }: useAdConnectionsProps) => {
    const { applicationUser } = useAuth();
    const [adConnections, setAdConnections] = useState<AdvertisingConnection[] | []>([]);

    useEffect(() => {
        if (applicationUser?.clientId)
            fetchCrmConnections();
    }, [applicationUser]);

    const fetchCrmConnections = async () => {
        const adConnections = await apiService.getAdvertisingConnections(platformName);
        setAdConnections(adConnections.data);
        setIsLoading(false);
    }

    return { adConnections };
}