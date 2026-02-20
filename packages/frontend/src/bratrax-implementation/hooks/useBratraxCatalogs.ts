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

const VALID_FIELD_TYPES = new Set<string>([
    'STRING',
    'INT64',
    'FLOAT64',
    'BOOLEAN',
    'TIMESTAMP',
    'DATE',
    'BYTES',
    'JSON',
]);

const SINGER_TYPE_MAP: Record<string, FieldType> = {
    string: 'STRING',
    integer: 'INT64',
    number: 'FLOAT64',
    boolean: 'BOOLEAN',
    object: 'JSON',
    array: 'JSON',
};

/**
 * Normalize Singer catalog field types that may arrive as arrays, objects,
 * or lowercase strings into a valid FieldType.
 *
 * Examples:
 *   "STRING"                    → "STRING"
 *   "string"                    → "STRING"
 *   ["null", "string"]          → "STRING"
 *   { type: "string" }          → "STRING"
 *   { anyOf: [{type:"string"}]} → "STRING"
 */
export function normalizeSingerType(raw: unknown): FieldType {
    if (typeof raw === 'string') {
        if (VALID_FIELD_TYPES.has(raw)) return raw as FieldType;
        if (SINGER_TYPE_MAP[raw]) return SINGER_TYPE_MAP[raw];
        const upper = raw.toUpperCase();
        if (VALID_FIELD_TYPES.has(upper)) return upper as FieldType;
        return 'STRING';
    }

    if (Array.isArray(raw)) {
        const nonNull = raw.filter(
            (t) => typeof t === 'string' && t !== 'null',
        );
        if (nonNull.length > 0) return normalizeSingerType(nonNull[0]);
        return 'STRING';
    }

    if (raw !== null && typeof raw === 'object') {
        const obj = raw as Record<string, unknown>;
        if (obj.type) return normalizeSingerType(obj.type);
        if (Array.isArray(obj.anyOf) && obj.anyOf.length > 0) {
            return normalizeSingerType(obj.anyOf[0]);
        }
        return 'JSON';
    }

    return 'STRING';
}

export type CatalogField = {
    name: string;
    type: string;
    nullable: boolean;
    behavior?: 'METRIC' | 'SEGMENT' | 'ATTRIBUTE' | 'PRIMARY KEY';
    field_exclusions?: string[];
    polymorphic?: boolean;
    schema_less_array?: boolean;
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
                type: normalizeSingerType(f.type),
                selected: true,
                ...(f.behavior ? { behavior: f.behavior } : {}),
                ...(f.field_exclusions?.length
                    ? { field_exclusions: f.field_exclusions }
                    : {}),
                ...(f.polymorphic ? { polymorphic: true } : {}),
                ...(f.schema_less_array ? { schema_less_array: true } : {}),
            })),
        })),
        source_name: c.source_name,
        raw_table: c.raw_table,
        source_type: c.source_type as SourceConnector['source_type'],
    }));
}

export function useBratraxCatalogs(projectUuid?: string) {
    return useQuery({
        queryKey: ['bratrax-catalogs', projectUuid],
        queryFn: async (): Promise<CatalogsResponse> => {
            try {
                const url = projectUuid
                    ? `${BRATRAX_API_BASE}/ontology/${projectUuid}/catalogs`
                    : `${BRATRAX_API_BASE}/catalogs`;
                const response = await fetch(url);
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
