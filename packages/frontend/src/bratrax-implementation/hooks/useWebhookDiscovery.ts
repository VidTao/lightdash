/**
 * Poll the ontology API to check if a webhook source has been discovered.
 * Only polls when `enabled` is true (modal open + not yet discovered).
 * Stops polling automatically once discovered=true.
 *
 * When discovery completes, invalidates the catalog query cache so that
 * SourcesBuilder and other consumers pick up the new schema immediately
 * rather than waiting for the default staleTime to expire.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

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
    const queryClient = useQueryClient();
    const hasInvalidated = useRef(false);

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
        onSuccess: (data) => {
            if (data.discovered && !hasInvalidated.current) {
                hasInvalidated.current = true;
                // Invalidate all catalog-related queries so the builder
                // picks up the newly discovered schema immediately.
                void queryClient.invalidateQueries({
                    queryKey: ['bratrax-catalogs'],
                });
                void queryClient.invalidateQueries({
                    queryKey: ['bratrax-catalog-search'],
                });
            }
        },
    });

    // Reset the invalidation guard when source changes or polling restarts
    if (!enabled || !query.data?.discovered) {
        hasInvalidated.current = false;
    }

    return {
        discovered: query.data?.discovered ?? false,
        streams: query.data?.streams ?? 0,
        fields: query.data?.fields ?? 0,
        isPolling: enabled && !query.data?.discovered,
    };
}
