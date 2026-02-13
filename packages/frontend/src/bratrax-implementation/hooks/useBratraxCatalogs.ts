/**
 * React Query hook for fetching real Meltano Singer catalog data
 * from the Bratrax API via the Lightdash backend proxy.
 *
 * Falls back to the hardcoded connectorCatalog when the API is unavailable,
 * so the FieldRefPicker works offline.
 */
import { useQuery } from '@tanstack/react-query';
import { CONNECTOR_CATALOG } from '../pages/WorkshopBuilder/connectorCatalog';
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
    streams: CatalogStream[];
};

export type CatalogsResponse = {
    catalogs: CatalogEntry[];
};

/**
 * Convert SourceConnector[] (hardcoded catalog) to CatalogEntry[] format.
 * Used as fallback when the Bratrax API is not running.
 */
function connectorCatalogToCatalogEntries(
    connectors: SourceConnector[],
): CatalogEntry[] {
    return connectors
        .filter((c) => c.available && c.streams.length > 0)
        .map((c) => ({
            tap: c.tap,
            label: c.label,
            category: c.category,
            streams: c.streams.map((s) => ({
                name: s.name,
                replication_method: null,
                key_properties: [],
                fields: s.fields.map((f) => ({
                    name: f.name,
                    type: f.type,
                    nullable: true,
                })),
            })),
        }));
}

const FALLBACK_CATALOGS: CatalogsResponse = {
    catalogs: connectorCatalogToCatalogEntries(CONNECTOR_CATALOG),
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
    }));
}

export function useBratraxCatalogs() {
    return useQuery({
        queryKey: ['bratrax-catalogs'],
        queryFn: async (): Promise<CatalogsResponse> => {
            try {
                const response = await fetch(`${BRATRAX_API_BASE}/catalogs`);
                if (!response.ok) {
                    return FALLBACK_CATALOGS;
                }
                const json = await response.json();
                const result = json.results as CatalogsResponse;
                // Use API data if it has catalogs, otherwise fallback
                if (result?.catalogs?.length > 0) {
                    return result;
                }
                return FALLBACK_CATALOGS;
            } catch {
                // API not running — use fallback
                return FALLBACK_CATALOGS;
            }
        },
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
}
