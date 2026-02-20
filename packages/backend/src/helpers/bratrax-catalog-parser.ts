/**
 * Parse raw Singer catalog JSON from the DB into structured format
 * the frontend and MCP tools expect.
 *
 * Mirrors the logic from catalog_reader.py's _parse_catalog_file() +
 * _extract_field_type(), translated to TypeScript.
 */

// ─── JSON helpers ───

/**
 * Safely parse catalog JSON from the DB.
 * Handles both pre-parsed objects and serialized strings.
 */
export function safeParseCatalogJson(raw: unknown): object | null {
    if (typeof raw === 'object' && raw !== null) {
        return raw as object;
    }
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw) as object;
        } catch {
            return null;
        }
    }
    return null;
}

// ─── Singer to BigQuery type map ───

const SINGER_TO_BQ: Record<string, string> = {
    string: 'STRING',
    integer: 'INT64',
    number: 'FLOAT64',
    boolean: 'BOOLEAN',
    object: 'JSON',
    array: 'JSON',
};

// ─── Source metadata registry (mirrors tap_registry.py) ───

export const SOURCE_REGISTRY: Record<
    string,
    {
        source_name: string;
        label: string;
        category: string;
        raw_table: string;
        source_type: string;
    }
> = {
    'tap-shopify': {
        source_name: 'shopify',
        label: 'Shopify',
        category: 'commerce',
        raw_table: 'raw_commerce_crm',
        source_type: 'meltano',
    },
    'tap-facebook': {
        source_name: 'facebook_ads',
        label: 'Facebook Ads',
        category: 'ads',
        raw_table: 'raw_ads',
        source_type: 'meltano',
    },
    'tap-googleads': {
        source_name: 'google_ads',
        label: 'Google Ads',
        category: 'ads',
        raw_table: 'raw_ads',
        source_type: 'meltano',
    },
    'tap-klaviyo': {
        source_name: 'klaviyo',
        label: 'Klaviyo',
        category: 'crm',
        raw_table: 'raw_commerce_crm',
        source_type: 'meltano',
    },
    'tap-amazon-sp': {
        source_name: 'amazon_sp',
        label: 'Amazon SP',
        category: 'commerce',
        raw_table: 'raw_commerce_crm',
        source_type: 'meltano',
    },
    'tap-amazonads': {
        source_name: 'amazonads',
        label: 'Amazon Ads',
        category: 'ads',
        raw_table: 'raw_ads',
        source_type: 'meltano',
    },
    'tap-applovin': {
        source_name: 'applovin',
        label: 'AppLovin',
        category: 'ads',
        raw_table: 'raw_ads',
        source_type: 'meltano',
    },
    'tap-gohighlevel': {
        source_name: 'gohighlevel',
        label: 'GoHighLevel',
        category: 'crm',
        raw_table: 'raw_commerce_crm',
        source_type: 'meltano',
    },
    'tap-leadbyte': {
        source_name: 'leadbyte',
        label: 'LeadByte',
        category: 'crm',
        raw_table: 'raw_commerce_crm',
        source_type: 'meltano',
    },
    'webhook-leadbyte': {
        source_name: 'leadbyte',
        label: 'LeadByte Webhooks',
        category: 'crm',
        raw_table: 'raw_webhook',
        source_type: 'webhook',
    },
    'webhook-slack-app': {
        source_name: 'slack_app',
        label: 'Slack App Webhooks',
        category: 'crm',
        raw_table: 'raw_webhook',
        source_type: 'webhook',
    },
    'webhook-shopify': {
        source_name: 'shopify_webhooks',
        label: 'Shopify Webhooks',
        category: 'commerce',
        raw_table: 'raw_webhook',
        source_type: 'webhook',
    },
};

// ─── Types ───

export type CatalogField = {
    name: string;
    type: string;
    nullable: boolean;
    behavior?: string;
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

// ─── Parsing functions ───

function extractFieldType(fieldInfo: {
    type?: string | string[];
    items?: { properties?: Record<string, unknown> };
}): {
    bqType: string;
    nullable: boolean;
    singerTypes: string[];
} {
    const rawType = fieldInfo.type ?? 'string';

    if (Array.isArray(rawType)) {
        const nonNull = rawType.filter((t) => t !== 'null');
        const isNullable = rawType.includes('null');
        const singerType = nonNull[0] ?? 'string';
        return {
            bqType: SINGER_TO_BQ[singerType] ?? 'STRING',
            nullable: isNullable,
            singerTypes: rawType,
        };
    }

    return {
        bqType: SINGER_TO_BQ[rawType] ?? 'STRING',
        nullable: true,
        singerTypes: [rawType],
    };
}

function buildFieldMetadataIndex(
    metadataEntries: Array<{
        breadcrumb?: string[];
        metadata?: Record<string, unknown>;
    }>,
): Record<string, Record<string, unknown>> {
    const index: Record<string, Record<string, unknown>> = {};
    for (const entry of metadataEntries) {
        const breadcrumb = entry.breadcrumb ?? [];
        if (breadcrumb.length === 2 && breadcrumb[0] === 'properties') {
            const fieldName = breadcrumb[1];
            index[fieldName] = entry.metadata ?? {};
        }
    }
    return index;
}

/**
 * Parse a raw Singer catalog JSON object into the structured CatalogEntry
 * format that the frontend and MCP tools consume.
 */
export function parseSingerCatalog(
    sourceKey: string,
    catalogJson: { streams?: Array<Record<string, unknown>> },
): CatalogEntry | null {
    const meta = SOURCE_REGISTRY[sourceKey] ?? {
        source_name: sourceKey.replace(/^(tap-|webhook-)/, ''),
        label: sourceKey,
        category: 'other',
        raw_table: 'raw_data',
        source_type: sourceKey.startsWith('webhook-') ? 'webhook' : 'meltano',
    };

    const rawStreams = catalogJson.streams ?? [];
    if (rawStreams.length === 0) {
        return null;
    }

    const streams: CatalogStream[] = [];

    for (const streamData of rawStreams) {
        const streamName =
            (streamData.stream as string) ??
            (streamData.tap_stream_id as string) ??
            'unknown';

        const schema = (streamData.schema as Record<string, unknown>) ?? {};
        const properties =
            (schema.properties as Record<string, Record<string, unknown>>) ??
            {};

        const fieldMetaIndex = buildFieldMetadataIndex(
            (streamData.metadata as Array<{
                breadcrumb?: string[];
                metadata?: Record<string, unknown>;
            }>) ?? [],
        );

        const fields: CatalogField[] = [];

        for (const fieldName of Object.keys(properties).sort()) {
            const fieldInfo = properties[fieldName];
            const { bqType, nullable, singerTypes } =
                extractFieldType(fieldInfo);

            const fieldMeta = fieldMetaIndex[fieldName];
            const hasArrayType = singerTypes.includes('array');
            const hasItemsSchema = !!(
                fieldInfo.items as Record<string, unknown> | undefined
            )?.properties;
            const nonNullTypes = singerTypes.filter((t) => t !== 'null');

            const behaviorVal = fieldMeta?.behavior as string | undefined;
            const exclusionsVal = fieldMeta?.fieldExclusions as
                | string[]
                | undefined;

            const field: CatalogField = {
                name: fieldName,
                type: bqType,
                nullable,
                ...(behaviorVal ? { behavior: behaviorVal } : {}),
                ...(exclusionsVal ? { field_exclusions: exclusionsVal } : {}),
                ...(hasArrayType && !hasItemsSchema
                    ? { schema_less_array: true }
                    : {}),
                ...(nonNullTypes.length > 1 ? { polymorphic: true } : {}),
            };

            fields.push(field);
        }

        streams.push({
            name: streamName,
            replication_method:
                (streamData.replication_method as string) ?? null,
            key_properties: (streamData.key_properties as string[]) ?? [],
            fields,
        });
    }

    return {
        tap: sourceKey,
        label: meta.label,
        category: meta.category,
        source_name: meta.source_name,
        raw_table: meta.raw_table,
        source_type: meta.source_type,
        streams,
    };
}

/**
 * Search across parsed catalog entries for fields matching a query.
 */
export function searchParsedCatalogs(
    catalogs: CatalogEntry[],
    query: string,
    typeFilter?: string,
    limit: number = 20,
): Array<{
    tap: string;
    label: string;
    stream: string;
    field: string;
    type: string;
    source_type: string;
    source_ref: string;
}> {
    const queryLower = query.toLowerCase();
    const results: Array<{
        tap: string;
        label: string;
        stream: string;
        field: string;
        type: string;
        source_type: string;
        source_ref: string;
    }> = [];

    for (const catalog of catalogs) {
        for (const stream of catalog.streams) {
            for (const field of stream.fields) {
                if (
                    field.name.toLowerCase().includes(queryLower) &&
                    (!typeFilter || field.type === typeFilter)
                ) {
                    results.push({
                        tap: catalog.tap,
                        label: catalog.label,
                        stream: stream.name,
                        field: field.name,
                        type: field.type,
                        source_type: catalog.source_type,
                        source_ref: `$sources.${catalog.source_name}.${stream.name}.${field.name}`,
                    });
                    if (results.length >= limit) {
                        return results;
                    }
                }
            }
        }
    }

    return results;
}
