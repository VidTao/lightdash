import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { StandardEvent } from '../tracking-plan/types';

export const useStandardEvents = (platform: string | null) => {
    const [events, setEvents] = useState<StandardEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                if (platform) {
                    setLoading(true);
                    const data = await apiService.getStandardEvents(platform);
                    setEvents(data);
                    setLoading(false);
                }
            } catch (error) {
                setError(error as Error);
            }
        };

        fetchEvents();
    }, [platform]);

    return { events, setEvents, loading, error };
};
