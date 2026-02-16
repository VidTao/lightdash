/**
 * React Query hook for fetching real Meltano Singer catalog data
 * from the Bratrax API via the Lightdash backend proxy.
 *
 * When the API is offline, returns empty catalogs with isOffline flag
 * so the UI can show "Start Bratrax API" instead of stale data.
 */
import { useQuery } from '@tanstack/react-query';
import type {
    FieldType,
    SourceConnector,
} from '../pages/WorkshopBuilder/types';

const BRATRAX_API_BASE = '/api/v1/bratrax';

export type CatalogField = {
    name: string;
    type: string;
    nullable: boolean;
};

export type CatalogStream = {
    name: string;
    replication_method: string | null;
    key_properties: string[];
    fields: CatalogField[];
};

export type CatalogEntry = {
    tap: string;
    label: string;
    category: string;
    source_name: string;
    raw_table: string;
    source_type: string;
    streams: CatalogStream[];
};

export type CatalogsResponse = {
    catalogs: CatalogEntry[];
    isOffline?: boolean;
};

/**
 * Convert CatalogEntry[] (API response) to SourceConnector[] (builder state).
 * Used by SourcesBuilder to populate the Sources tab from real Meltano data.
 */
export function catalogEntriesToSourceConnectors(
    catalogs: CatalogEntry[],
): SourceConnector[] {
    return catalogs.map((c) => ({
        tap: c.tap,
        label: c.label,
        category: c.category as SourceConnector['category'],
        available: true,
        streams: c.streams.map((s) => ({
            name: s.name,
            selected: false,
            fields: s.fields.map((f) => ({
                name: f.name,
                type: (f.type as FieldType) || 'STRING',
                selected: true,
            })),
        })),
        source_name: c.source_name,
        raw_table: c.raw_table,
        source_type: c.source_type as SourceConnector['source_type'],
    }));
}

export function useBratraxCatalogs() {
    return useQuery({
        queryKey: ['bratrax-catalogs'],
        queryFn: async (): Promise<CatalogsResponse> => {
            try {
                const response = await fetch(`${BRATRAX_API_BASE}/catalogs`);
                if (!response.ok) {
                    return { catalogs: [], isOffline: true };
                }
                const json = await response.json();
                const result = json.results as CatalogsResponse;
                if (result?.catalogs?.length > 0) {
                    return { catalogs: result.catalogs };
                }
                return { catalogs: [], isOffline: true };
            } catch {
                return { catalogs: [], isOffline: true };
            }
        },
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
}
