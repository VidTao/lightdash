import { useEffect } from "react";

import { useState } from "react";
import { apiService } from "../services/api";
import { Property } from "../pages/tracking-plan/types";

interface PropertiesState {
    properties: Property[];
    loading: boolean;
    error: Error | null;
}


export const useProperties = () => {
    const [state, setState] = useState<PropertiesState>({
        properties: [],
        loading: true,
        error: null
    });

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const data = await apiService.getProperties();
                setState({
                    properties: data,
                    loading: false,
                    error: null
                });
            } catch (error) {
                setState({
                    properties: [],
                    loading: false,
                    error: error as Error
                });
            }
        };

        fetchEvents();
    }, []);

    return state;
};