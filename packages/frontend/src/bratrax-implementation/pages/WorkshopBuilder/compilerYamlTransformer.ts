/**
 * Transforms WorkshopBuilder state into compiler-compatible YAML strings.
 *
 * The Builder uses a simplified format (tap names as keys, flat ref strings).
 * The compiler expects a different structure (logical source names, nested
 * backing/derived/computed defs, primary_key, table, etc.).
 */
import yaml from 'js-yaml';
import type {
    BuilderState,
    ObjectProperty,
    OntologyObject,
    SourceConnector,
    TrackingEvent,
} from './types';

export type CompilerYamlPayload = {
    config: string;
    ontology: string;
    sources: string;
    tracking_plan: string;
};

// ─── Source name resolution (uses enriched catalog data from SourceConnector) ───

// ─── BQ type mapping (Builder uses BQ types, compiler uses them directly) ───

const FIELD_TYPE_TO_COMPILER: Record<string, string> = {
    STRING: 'string',
    INT64: 'integer',
    FLOAT64: 'decimal',
    BOOLEAN: 'boolean',
    TIMESTAMP: 'timestamp',
    DATE: 'date',
    BYTES: 'string',
    JSON: 'json',
};

function logicalSourceName(src: SourceConnector): string {
    return src.source_name ?? src.tap.replace('tap-', '');
}

// ─── Ref parsing ───

/**
 * Parse "$sources.shopify.orders.order_id"
 * → { source: "$sources.shopify.orders", field: "order_id" }
 */
function parseBackingRef(ref: string): {
    source: string;
    field: string;
} | null {
    const parts = ref.split('.');
    // Expected: $sources.<source>.<stream>.<field>
    if (parts.length < 4 || parts[0] !== '$sources') return null;
    const field = parts[parts.length - 1];
    const source = parts.slice(0, parts.length - 1).join('.');
    return { source, field };
}

/**
 * Detect if a ref is an event ref ($events.X) or source ref.
 */
function isEventRef(ref: string): boolean {
    return ref.startsWith('$events.');
}

// ─── Config YAML ───

export function generateCompilerConfig(clientName: string): string {
    const config = {
        client_id: clientName,
        display_name: clientName.charAt(0).toUpperCase() + clientName.slice(1),
        description: `${clientName} data pipeline`,
        stack: 'shopify-paid-media',
        warehouse: {
            type: 'bigquery',
            project: 'bratrax',
            raw_dataset: 'raw_data',
            cod_dataset: 'cod',
        },
    };
    return yaml.dump(config, { lineWidth: 120, noRefs: true });
}

// ─── Sources YAML ───

function buildSourceEntry(src: SourceConnector) {
    const name = logicalSourceName(src);
    const selectedStreams = src.streams.filter((s) => s.selected);
    if (selectedStreams.length === 0) return null;

    const sourceType = src.source_type ?? 'meltano';
    const rawTable = src.raw_table ?? 'raw_data';

    const streams: Record<string, unknown> = {};
    for (const stream of selectedStreams) {
        const fields: Record<string, string> = {};
        for (const field of stream.fields.filter((f) => f.selected)) {
            fields[field.name] = field.type;
        }
        streams[stream.name] = {
            key_properties: [stream.fields[0]?.name ?? 'id'],
            raw_filter: { stream: stream.name },
            fields,
        };
    }

    const entry: Record<string, unknown> = {
        type: sourceType,
        description: src.label,
        tap: src.tap,
        raw_table: rawTable,
        raw_filter: { source: name },
        streams,
    };

    return { name, entry };
}

export function generateCompilerSources(
    state: BuilderState,
    namespace: string,
): string {
    const sourcesMap: Record<string, unknown> = {};

    for (const src of state.sources) {
        const result = buildSourceEntry(src);
        if (result) {
            sourcesMap[result.name] = result.entry;
        }
    }

    // Check if any events exist (implies browser_events source needed)
    const hasBrowserEvents = state.events.length > 0;
    if (hasBrowserEvents && !sourcesMap['browser_events']) {
        sourcesMap['browser_events'] = {
            type: 'pubsub',
            description: 'Browser events from tracking pixel',
            produces_events: state.events.map((e) => `$events.${e.name}`),
            field_mapping: {
                activity_id: 'event_id',
                ts: 'timestamp',
                activity: 'event_name',
                customer: 'user_id',
                anonymous_id: 'anonymous_id',
                features: 'properties',
                revenue_impact: 'properties.revenue',
                source: "'browser'",
            },
        };
    }

    const spec: Record<string, unknown> = {
        version: '1.0',
        namespace,
        activity_stream: {
            database: 'bigquery',
            table: 'activity_stream',
            schema: {
                activity_id: { type: 'STRING' },
                ts: { type: 'TIMESTAMP' },
                activity: { type: 'STRING' },
                customer: { type: 'STRING' },
                anonymous_id: { type: 'STRING' },
                features: { type: 'JSON' },
                revenue_impact: { type: 'FLOAT64' },
                source: { type: 'STRING' },
            },
        },
        sources: sourcesMap,
    };

    return yaml.dump(spec, { lineWidth: 120, noRefs: true });
}

// ─── Ontology YAML ───

function buildPropertyDef(prop: ObjectProperty) {
    const compilerType = FIELD_TYPE_TO_COMPILER[prop.type] ?? 'string';

    if (prop.kind === 'backing') {
        const parsed = parseBackingRef(prop.ref);
        if (parsed) {
            return {
                type: compilerType,
                backing: {
                    source: parsed.source,
                    field: parsed.field,
                },
            };
        }
        // Fallback: treat as direct reference
        return { type: compilerType, backing: { source: prop.ref, field: '' } };
    }

    if (prop.kind === 'derived') {
        // Parse derived ref: "$events.order_completed" or more complex
        const derivedDef: Record<string, unknown> = {
            type: 'sum', // Default derivation type
        };
        if (isEventRef(prop.ref)) {
            derivedDef.event = prop.ref;
        }
        return { type: compilerType, derived: derivedDef };
    }

    if (prop.kind === 'computed') {
        return {
            type: compilerType,
            computed: {
                formula: prop.ref,
            },
        };
    }

    return { type: compilerType };
}

function inferPrimaryKey(obj: OntologyObject): string {
    // Try to find a property ending with _id
    const idProp = obj.properties.find(
        (p) => p.name.endsWith('_id') && p.kind === 'backing',
    );
    return idProp?.name ?? obj.properties[0]?.name ?? 'id';
}

export function generateCompilerOntology(
    state: BuilderState,
    namespace: string,
): string {
    const objects: Record<string, unknown> = {};

    for (const obj of state.objects) {
        const properties: Record<string, unknown> = {};
        for (const prop of obj.properties) {
            properties[prop.name] = buildPropertyDef(prop);
        }

        const primaryKey = inferPrimaryKey(obj);
        objects[obj.name] = {
            description: `${obj.name} object`,
            primary_key: primaryKey,
            table: `dim_${obj.name.toLowerCase()}s`,
            properties,
        };
    }

    // Build links in compiler format: { from: "Customer.customer_id", to: "Order.customer_id" }
    const links: Record<string, unknown> = {};
    for (const link of state.links) {
        const srcObj = state.objects.find((o) => o.id === link.sourceObjectId);
        const tgtObj = state.objects.find((o) => o.id === link.targetObjectId);
        if (!srcObj || !tgtObj) continue;

        const srcPK = inferPrimaryKey(srcObj);
        // Find matching property in target
        const matchProp = tgtObj.properties.find(
            (p) => p.name === srcPK || p.name.includes(srcObj.name.toLowerCase()),
        );
        const tgtField = matchProp?.name ?? srcPK;

        const linkName = `${srcObj.name}_${tgtObj.name}`;
        links[linkName] = {
            from: `${srcObj.name}.${srcPK}`,
            to: `${tgtObj.name}.${tgtField}`,
            cardinality: link.cardinality.replace(/-/g, '_'),
        };
    }

    const spec: Record<string, unknown> = {
        version: '1.0',
        namespace,
        objects,
    };

    if (Object.keys(links).length > 0) {
        spec.links = links;
    }

    return yaml.dump(spec, { lineWidth: 120, noRefs: true });
}

// ─── Tracking Plan YAML ───

function buildEventDef(event: TrackingEvent, objects: OntologyObject[]) {
    const eventDef: Record<string, unknown> = {
        category: event.category === 'page_view' ? 'navigation' : 'ecommerce',
        source: '$sources.browser_events',
    };

    if (event.properties.length > 0) {
        const properties: Record<string, unknown> = {};
        for (const prop of event.properties) {
            const compilerType = FIELD_TYPE_TO_COMPILER[prop.type] ?? 'string';
            const propDef: Record<string, unknown> = { type: compilerType };
            if (prop.required) propDef.required = true;
            properties[prop.name] = propDef;
        }
        eventDef.properties = properties;
    }

    // Build enriches from enrichment mappings
    if (event.enrichments.length > 0) {
        const enrichedObjects = new Set<string>();
        for (const enrichment of event.enrichments) {
            const obj = objects.find((o) => o.id === enrichment.objectId);
            if (obj) {
                enrichedObjects.add(`$objects.${obj.name}`);
            }
        }
        if (enrichedObjects.size > 0) {
            eventDef.enriches = Array.from(enrichedObjects);
        }
    }

    return eventDef;
}

export function generateCompilerTrackingPlan(
    state: BuilderState,
    namespace: string,
): string {
    const events: Record<string, unknown> = {};

    for (const event of state.events) {
        events[event.name] = buildEventDef(event, state.objects);
    }

    // Derive categories from events
    const categories: Record<string, unknown> = {};
    const usedCategories = new Set(state.events.map((e) => e.category));
    if (usedCategories.has('page_view')) {
        categories.navigation = {
            description: 'Page views and navigation',
            color: '#3b82f6',
        };
    }
    if (usedCategories.has('track') || usedCategories.has('identify')) {
        categories.ecommerce = {
            description: 'Shopping and purchase events',
            color: '#10b981',
        };
    }

    const spec: Record<string, unknown> = {
        version: '1.0',
        namespace,
    };

    if (Object.keys(categories).length > 0) {
        spec.categories = categories;
    }

    spec.events = events;

    return yaml.dump(spec, { lineWidth: 120, noRefs: true });
}

// ─── Bundle ───

export function toCompilerPayload(
    state: BuilderState,
    clientName: string,
): CompilerYamlPayload {
    const namespace = clientName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    return {
        config: generateCompilerConfig(clientName),
        ontology: generateCompilerOntology(state, namespace),
        sources: generateCompilerSources(state, namespace),
        tracking_plan: generateCompilerTrackingPlan(state, namespace),
    };
}
