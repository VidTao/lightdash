// ─── Sources Builder ───

export type FieldType =
    | 'STRING'
    | 'INT64'
    | 'FLOAT64'
    | 'BOOLEAN'
    | 'TIMESTAMP'
    | 'DATE'
    | 'BYTES'
    | 'JSON';

export type SourceField = {
    name: string;
    type: FieldType;
    selected: boolean;
    behavior?: 'METRIC' | 'SEGMENT' | 'ATTRIBUTE' | 'PRIMARY KEY';
    field_exclusions?: string[];
    polymorphic?: boolean;
    schema_less_array?: boolean;
};

export type SourceStream = {
    name: string;
    fields: SourceField[];
    selected: boolean;
};

export type SourceConnector = {
    tap: string;
    label: string;
    category: 'ads' | 'commerce' | 'crm' | 'analytics' | 'database' | 'other';
    available: boolean;
    streams: SourceStream[];
    source_name?: string;
    raw_table?: string;
    source_type?: 'meltano' | 'webhook' | 'pubsub';
    field_mapping?: Record<string, string>;
    produces_events?: string[];
};

// ─── Ontology Builder ───

export type PropertyKind = 'backing' | 'derived' | 'computed' | 'system';

export type SourceMapping = {
    ref: string; // e.g. $sources.google_ads.campaign_performance_report.cost_micros
    transform?: string; // e.g. "SAFE_DIVIDE({value}, 1000000)"
};

export type ObjectProperty = {
    id: string;
    name: string;
    type: FieldType;
    kind: PropertyKind;
    ref: string; // primary source ref, e.g. $sources.shopify.orders.order_id
    additionalMappings?: SourceMapping[]; // extra sources for multi-source backing
};

export type ObjectLink = {
    id: string;
    sourceObjectId: string;
    targetObjectId: string;
    verb: string; // e.g. "OWNS", "PLACES", "RUNS"
    cardinality: 'one-to-one' | 'one-to-many' | 'many-to-many';
};

export type OntologyObject = {
    id: string;
    name: string;
    properties: ObjectProperty[];
};

// ─── Tracking Plan Builder ───

export type EventCategory = 'page_view' | 'identify' | 'track' | 'group';
export type CollectionMethod = 'browser' | 'webhook' | 'api_pull';

export type EventProperty = {
    id: string;
    name: string;
    type: FieldType;
    required: boolean;
};

export type EnrichmentMapping = {
    eventPropertyId: string;
    objectId: string;
    objectPropertyName: string;
};

export type TrackingEvent = {
    id: string;
    name: string;
    category: EventCategory;
    collectionMethod: CollectionMethod;
    source: string;
    properties: EventProperty[];
    enrichments: EnrichmentMapping[];
    // Preserved from YAML — passed through on save
    attribution?: Record<string, unknown>;
    revenueImpact?: string;
    tests?: Array<Record<string, unknown>>;
    trigger?: string;
    description?: string;
};

// ─── Builder State ───

export type TrackingPlanMeta = {
    categories: Record<string, unknown>;
    validation?: Record<string, unknown>;
    identity?: Record<string, unknown>;
};

export type BuilderState = {
    sources: SourceConnector[];
    objects: OntologyObject[];
    links: ObjectLink[];
    events: TrackingEvent[];
    trackingPlanMeta?: TrackingPlanMeta;
};

export type BuilderTab = 'sources' | 'ontology' | 'tracking-plan';

// ─── Validation ───

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type ValidationMessage = {
    severity: ValidationSeverity;
    tab: BuilderTab;
    message: string;
};

// ─── Compiler Integration ───

export type CompilerYamlPayload = {
    config: string;
    ontology: string;
    sources: string;
    tracking_plan: string;
};

export type YamlFormat = 'builder' | 'compiler';
