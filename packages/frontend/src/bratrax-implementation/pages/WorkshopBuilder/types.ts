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
};

// ─── Ontology Builder ───

export type PropertyKind = 'backing' | 'derived' | 'computed';

export type ObjectProperty = {
    id: string;
    name: string;
    type: FieldType;
    kind: PropertyKind;
    ref: string; // e.g. $sources.shopify.orders.order_id, or SQL formula for computed
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
    properties: EventProperty[];
    enrichments: EnrichmentMapping[];
};

// ─── Builder State ───

export type BuilderState = {
    sources: SourceConnector[];
    objects: OntologyObject[];
    links: ObjectLink[];
    events: TrackingEvent[];
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
