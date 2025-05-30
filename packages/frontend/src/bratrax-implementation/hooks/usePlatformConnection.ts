import { useEffect } from "react";

import { useState } from "react";
import { PlatformConnection } from "../models/interfaces";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface UsePlatformConnectionProps {
    platformName: string;
    setIsLoading: (isLoading: boolean) => void;
}

export const usePlatformConnection = ({ platformName, setIsLoading }: UsePlatformConnectionProps) => {
    const { applicationUser } = useAuth();
    const [platformConnection, setPlatformConnection] = useState<PlatformConnection | null>(null);

    useEffect(() => {
        if (applicationUser?.clientId)
            fetchPlatformConnection();
    }, [applicationUser]);

    const fetchPlatformConnection = async () => {
        const platformConnection = await apiService.getPlatformConnection(platformName);
        setPlatformConnection(platformConnection.data);
        setIsLoading(false);
    }

    return { platformConnection };
}