/**
 * React Query hook for searching field names across all Meltano taps.
 */
import { useQuery } from '@tanstack/react-query';

const BRATRAX_API_BASE = '/api/v1/bratrax';

export type CatalogSearchResult = {
    tap: string;
    label: string;
    stream: string;
    field: string;
    type: string;
    source_ref: string;
};

export type CatalogSearchResponse = {
    query: string;
    results: CatalogSearchResult[];
    count: number;
};

export function useBratraxCatalogSearch(
    query: string,
    options?: { type?: string; enabled?: boolean },
) {
    const trimmed = query.trim();
    return useQuery({
        queryKey: ['bratrax-catalog-search', trimmed, options?.type],
        queryFn: async (): Promise<CatalogSearchResponse> => {
            const params = new URLSearchParams({ q: trimmed });
            if (options?.type) params.set('type', options.type);
            const response = await fetch(
                `${BRATRAX_API_BASE}/catalogs/search?${params.toString()}`,
            );
            if (!response.ok) {
                return { query: trimmed, results: [], count: 0 };
            }
            const json = await response.json();
            return json.results as CatalogSearchResponse;
        },
        enabled: (options?.enabled ?? true) && trimmed.length >= 2,
        staleTime: 60 * 1000,
    });
}
