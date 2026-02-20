/**
 * Poll the ontology API to check if a webhook source has been discovered.
 * Only polls when `enabled` is true (modal open + not yet discovered).
 * Stops polling automatically once discovered=true.
 */
import { useQuery } from '@tanstack/react-query';

const BRATRAX_API_BASE = '/api/v1/bratrax';

interface DiscoveryStatus {
    source: string;
    discovered: boolean;
    streams: number;
    fields: number;
    label?: string;
}

export function useWebhookDiscovery(
    source: string,
    enabled: boolean,
    projectUuid?: string,
) {
    const query = useQuery({
        queryKey: ['webhook-discovery-status', source, projectUuid],
        queryFn: async (): Promise<DiscoveryStatus> => {
            try {
                const url = projectUuid
                    ? `${BRATRAX_API_BASE}/ontology/${projectUuid}/webhook-discovery-status/${source}`
                    : `${BRATRAX_API_BASE}/webhooks/${source}/discovery-status`;
                const resp = await fetch(url);
                if (!resp.ok) {
                    return {
                        source,
                        discovered: false,
                        streams: 0,
                        fields: 0,
                    };
                }
                const json = await resp.json();
                return json.results ?? json;
            } catch {
                return {
                    source,
                    discovered: false,
                    streams: 0,
                    fields: 0,
                };
            }
        },
        enabled,
        refetchInterval: (data) => {
            // Stop polling once discovered
            if (data?.discovered) return false;
            return 5000;
        },
        staleTime: 0,
    });

    return {
        discovered: query.data?.discovered ?? false,
        streams: query.data?.streams ?? 0,
        fields: query.data?.fields ?? 0,
        isPolling: enabled && !query.data?.discovered,
    };
}
