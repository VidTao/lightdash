import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import { PeriscopeEvent } from "../models/interfaces";

export const usePeriscopeEvents = (accountId: string | null) => {
  const [events, setEvents] = useState<PeriscopeEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!accountId) return;
      try {
        const response = await apiService.getPeriscopeEvents(accountId);
        setEvents(response.data);
      } catch (error) {
        console.error("Error fetching periscope events:", error);
      }
    };

    fetchEvents();
  }, [accountId]);

  return { events, setEvents };
};
