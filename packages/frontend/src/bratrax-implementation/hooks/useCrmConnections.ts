import { useEffect } from "react";

import { useState } from "react";
import { CrmConnection } from "../models/interfaces";
import { apiService } from "../services/api";
import { useAuth } from "../context/AuthContext";

interface useCrmConnectionsProps {
    platformName: string;
    setIsLoading: (isLoading: boolean) => void;
}

export const useCrmConnections = ({ platformName, setIsLoading }: useCrmConnectionsProps) => {
    const { applicationUser } = useAuth();
    const [crmConnections, setcrmConnections] = useState<CrmConnection[] | []>([]);

    useEffect(() => {
        if (applicationUser?.clientId)
            fetchCrmConnections();
    }, [applicationUser]);

    const fetchCrmConnections = async () => {
        const crmConnections = await apiService.getCRMConnections(platformName);
        setcrmConnections(crmConnections.data);
        setIsLoading(false);
    }

    return { crmConnections };
}