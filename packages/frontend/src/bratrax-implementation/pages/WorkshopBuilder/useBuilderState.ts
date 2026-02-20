import yaml from 'js-yaml';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ValidateResult } from '../../hooks/useBratraxApi';
import {
    normalizeSingerType,
    useBratraxCatalogs,
    type CatalogEntry,
} from '../../hooks/useBratraxCatalogs';
import {
    useBratraxOntology,
    useBratraxSaveOntologyYaml,
} from '../../hooks/useBratraxClients';
import { toCompilerPayload } from './compilerYamlTransformer';
import { computeExclusionConflicts } from './fieldWarnings';
import type {
    BuilderState,
    CollectionMethod,
    EnrichmentMapping,
    EventCategory,
    EventProperty,
    FieldType,
    ObjectLink,
    ObjectProperty,
    OntologyObject,
    PropertyKind,
    SourceConnector,
    SourceMapping,
    TrackingEvent,
    TrackingPlanMeta,
    ValidationMessage,
} from './types';
import { useAutoSourceSync } from './useAutoSourceSync';

/**
 * Find the catalog stream that corresponds to a YAML stream name.
 *
 * Tries in order:
 *   1. Exact name match
 *   2. Prefix-stripped match (e.g. "webhook_sold_unsold" → "sold_unsold")
 *   3. Single-stream fallback — if the catalog has only one stream, use it
 *      (webhook sources often rename streams between discovery and YAML)
 */
function findMatchingCatalogStream(
    yamlStreamName: string,
    catalogStreams: {
        name: string;
        fields: { name: string; type: string }[];
    }[],
): { name: string; fields: { name: string; type: string }[] } | undefined {
    // 1. Exact match
    const exact = catalogStreams.find((s) => s.name === yamlStreamName);
    if (exact) return exact;

    // 2. Prefix-stripped match
    const prefixMatch = catalogStreams.find((s) => {
        const stripped = s.name.replace(/^(webhook|tap)_/, '');
        return stripped === yamlStreamName;
    });
    if (prefixMatch) return prefixMatch;

    // 3. Single-stream fallback
    if (catalogStreams.length === 1) return catalogStreams[0];

    return undefined;
}

/**
 * Scan ontology YAML backing refs and return a Set of source field keys
 * like "leadbyte.sold_unsold.lead_id" (from "$sources.leadbyte.sold_unsold" + field "lead_id").
 */
function collectOntologyFieldRefs(ontologyYaml: string): Set<string> {
    const refs = new Set<string>();
    try {
        const parsed = yaml.load(ontologyYaml) as Record<string, unknown>;
        const objects = (parsed?.objects as Record<string, unknown>) ?? {};
        for (const objData of Object.values(objects)) {
            const props =
                ((objData as Record<string, unknown>).properties as Record<
                    string,
                    unknown
                >) ?? {};
            for (const propData of Object.values(props)) {
                const pd = propData as Record<string, unknown>;
                if (!pd.backing) continue;
                const backings = Array.isArray(pd.backing)
                    ? pd.backing
                    : [pd.backing];
                for (const b of backings) {
                    const backing = b as Record<string, string>;
                    const src = (backing.source ?? '').replace('$sources.', '');
                    const fld = backing.field ?? '';
                    if (src && fld) refs.add(`${src}.${fld}`);
                }
            }
        }
    } catch {
        /* ignore parse errors */
    }
    return refs;
}

const INITIAL_STATE: BuilderState = {
    sources: [],
    objects: [],
    links: [],
    events: [],
};

export function useBuilderState(projectUuid?: string) {
    const [state, setState] = useState<BuilderState>(INITIAL_STATE);
    const [compilerValidation, setCompilerValidation] =
        useState<ValidateResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);
    const [clientName, setClientName] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isAutoLoading, setIsAutoLoading] = useState(false);

    const saveOntologyYamlMutation = useBratraxSaveOntologyYaml(projectUuid);

    // Auto-load ontology from project binding
    const { data: ontologyData } = useBratraxOntology(projectUuid);

    // Wrap setState to track dirty state
    const setDirtyState = useCallback(
        (updater: BuilderState | ((prev: BuilderState) => BuilderState)) => {
            setState(updater);
            setIsDirty(true);
        },
        [],
    );

    // Catalog data for template loading and auto-sync
    const { data: catalogsData } = useBratraxCatalogs(projectUuid);
    const catalogs = catalogsData?.catalogs;

    // ─── Sources ───

    const setSources = useCallback(
        (sources: SourceConnector[]) => {
            setDirtyState((prev) => ({ ...prev, sources }));
        },
        [setDirtyState],
    );

    const toggleStream = useCallback(
        (tapName: string, streamName: string) => {
            setDirtyState((prev) => ({
                ...prev,
                sources: prev.sources.map((src) =>
                    src.tap === tapName
                        ? {
                              ...src,
                              streams: src.streams.map((s) =>
                                  s.name === streamName
                                      ? { ...s, selected: !s.selected }
                                      : s,
                              ),
                          }
                        : src,
                ),
            }));
        },
        [setDirtyState],
    );

    const toggleField = useCallback(
        (tapName: string, streamName: string, fieldName: string) => {
            setDirtyState((prev) => ({
                ...prev,
                sources: prev.sources.map((src) =>
                    src.tap === tapName
                        ? {
                              ...src,
                              streams: src.streams.map((s) =>
                                  s.name === streamName
                                      ? {
                                            ...s,
                                            fields: s.fields.map((f) =>
                                                f.name === fieldName
                                                    ? {
                                                          ...f,
                                                          selected: !f.selected,
                                                      }
                                                    : f,
                                            ),
                                        }
                                      : s,
                              ),
                          }
                        : src,
                ),
            }));
        },
        [setDirtyState],
    );

    // ─── Objects ───

    const addObject = useCallback(
        (obj: OntologyObject) => {
            setDirtyState((prev) => ({
                ...prev,
                objects: [...prev.objects, obj],
            }));
        },
        [setDirtyState],
    );

    const updateObject = useCallback(
        (objectId: string, updates: Partial<OntologyObject>) => {
            setDirtyState((prev) => ({
                ...prev,
                objects: prev.objects.map((o) =>
                    o.id === objectId ? { ...o, ...updates } : o,
                ),
            }));
        },
        [setDirtyState],
    );

    const removeObject = useCallback(
        (objectId: string) => {
            setDirtyState((prev) => ({
                ...prev,
                objects: prev.objects.filter((o) => o.id !== objectId),
                links: prev.links.filter(
                    (l) =>
                        l.sourceObjectId !== objectId &&
                        l.targetObjectId !== objectId,
                ),
            }));
        },
        [setDirtyState],
    );

    const addProperty = useCallback(
        (objectId: string, prop: ObjectProperty) => {
            setDirtyState((prev) => ({
                ...prev,
                objects: prev.objects.map((o) =>
                    o.id === objectId
                        ? { ...o, properties: [...o.properties, prop] }
                        : o,
                ),
            }));
        },
        [setDirtyState],
    );

    const removeProperty = useCallback(
        (objectId: string, propertyId: string) => {
            setDirtyState((prev) => ({
                ...prev,
                objects: prev.objects.map((o) =>
                    o.id === objectId
                        ? {
                              ...o,
                              properties: o.properties.filter(
                                  (p) => p.id !== propertyId,
                              ),
                          }
                        : o,
                ),
            }));
        },
        [setDirtyState],
    );

    // ─── Links ───

    const addLink = useCallback(
        (link: ObjectLink) => {
            setDirtyState((prev) => ({
                ...prev,
                links: [...prev.links, link],
            }));
        },
        [setDirtyState],
    );

    const removeLink = useCallback(
        (linkId: string) => {
            setDirtyState((prev) => ({
                ...prev,
                links: prev.links.filter((l) => l.id !== linkId),
            }));
        },
        [setDirtyState],
    );

    // ─── Events ───

    const addEvent = useCallback(
        (event: TrackingEvent) => {
            setDirtyState((prev) => ({
                ...prev,
                events: [...prev.events, event],
            }));
        },
        [setDirtyState],
    );

    const updateEvent = useCallback(
        (eventId: string, updates: Partial<TrackingEvent>) => {
            setDirtyState((prev) => ({
                ...prev,
                events: prev.events.map((e) =>
                    e.id === eventId ? { ...e, ...updates } : e,
                ),
            }));
        },
        [setDirtyState],
    );

    const removeEvent = useCallback(
        (eventId: string) => {
            setDirtyState((prev) => ({
                ...prev,
                events: prev.events.filter((e) => e.id !== eventId),
            }));
        },
        [setDirtyState],
    );

    const addEventProperty = useCallback(
        (eventId: string, prop: EventProperty) => {
            setDirtyState((prev) => ({
                ...prev,
                events: prev.events.map((e) =>
                    e.id === eventId
                        ? { ...e, properties: [...e.properties, prop] }
                        : e,
                ),
            }));
        },
        [setDirtyState],
    );

    const addEnrichment = useCallback(
        (eventId: string, enrichment: EnrichmentMapping) => {
            setDirtyState((prev) => ({
                ...prev,
                events: prev.events.map((e) =>
                    e.id === eventId
                        ? { ...e, enrichments: [...e.enrichments, enrichment] }
                        : e,
                ),
            }));
        },
        [setDirtyState],
    );

    // ─── Template loading ───

    const loadFromTemplate = useCallback(
        (files: Record<string, string>) => {
            const ontologyRefs = collectOntologyFieldRefs(files.ontology ?? '');

            const newState: BuilderState = {
                sources: [],
                objects: [],
                links: [],
                events: [],
            };

            // Parse sources YAML -> builder sources
            if (files.sources) {
                try {
                    const sourcesYaml = yaml.load(files.sources) as Record<
                        string,
                        unknown
                    >;
                    const sourcesMap =
                        (sourcesYaml?.sources as Record<string, unknown>) ?? {};

                    for (const [srcName, srcData] of Object.entries(
                        sourcesMap,
                    )) {
                        const data = srcData as Record<string, unknown>;
                        const tap = (data.tap as string) ?? `tap-${srcName}`;

                        // Try to find matching catalog entry for label/category
                        const catalogEntry = catalogs?.find(
                            (c: CatalogEntry) => c.tap === tap,
                        );

                        const streamsData =
                            (data.streams as Record<string, unknown>) ?? {};
                        const streams = Object.entries(streamsData).map(
                            ([streamName, streamData]) => {
                                const sd = streamData as Record<
                                    string,
                                    unknown
                                >;
                                const fieldsData =
                                    (sd.fields as Record<string, unknown>) ??
                                    {};

                                // Build field list: catalog is primary, YAML-only fields marked stale
                                const catalogStream = catalogEntry
                                    ? findMatchingCatalogStream(
                                          streamName,
                                          catalogEntry.streams,
                                      )
                                    : undefined;

                                const catalogFieldNames = new Set(
                                    catalogStream?.fields.map((f) => f.name) ??
                                        [],
                                );

                                const fields: Array<{
                                    name: string;
                                    type: FieldType;
                                    selected: boolean;
                                    stale?: boolean;
                                }> = [];

                                if (catalogStream) {
                                    // Start with catalog fields (the real source of truth)
                                    for (const cf of catalogStream.fields) {
                                        fields.push({
                                            name: cf.name,
                                            type: normalizeSingerType(cf.type),
                                            selected: ontologyRefs.has(
                                                `${srcName}.${streamName}.${cf.name}`,
                                            ),
                                        });
                                    }

                                    // Then add YAML-only fields, marked stale
                                    for (const [
                                        fieldName,
                                        fieldValue,
                                    ] of Object.entries(fieldsData)) {
                                        if (!catalogFieldNames.has(fieldName)) {
                                            fields.push({
                                                name: fieldName,
                                                type: normalizeSingerType(
                                                    fieldValue,
                                                ),
                                                selected: ontologyRefs.has(
                                                    `${srcName}.${streamName}.${fieldName}`,
                                                ),
                                                stale: true,
                                            });
                                        }
                                    }
                                } else {
                                    // No catalog entry — fall back to YAML fields without stale marking
                                    for (const [
                                        fieldName,
                                        fieldValue,
                                    ] of Object.entries(fieldsData)) {
                                        fields.push({
                                            name: fieldName,
                                            type: normalizeSingerType(
                                                fieldValue,
                                            ),
                                            selected: ontologyRefs.has(
                                                `${srcName}.${streamName}.${fieldName}`,
                                            ),
                                        });
                                    }
                                }

                                return {
                                    name: streamName,
                                    fields,
                                    selected: true,
                                };
                            },
                        );

                        const sourceType =
                            (data.source_type as SourceConnector['source_type']) ??
                            ((data.type as string) === 'webhook'
                                ? 'webhook'
                                : (data.type as string) === 'pubsub'
                                  ? 'pubsub'
                                  : undefined);

                        newState.sources.push({
                            tap,
                            label:
                                catalogEntry?.label ??
                                srcName
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                            category:
                                (catalogEntry?.category as SourceConnector['category']) ??
                                (sourceType === 'pubsub'
                                    ? 'analytics'
                                    : 'other'),
                            available: true,
                            streams,
                            source_name: srcName,
                            source_type: sourceType,
                            ...(data.field_mapping
                                ? {
                                      field_mapping:
                                          data.field_mapping as Record<
                                              string,
                                              string
                                          >,
                                  }
                                : {}),
                            ...(data.produces_events
                                ? {
                                      produces_events:
                                          data.produces_events as string[],
                                  }
                                : {}),
                        });
                    }
                } catch {
                    // Silently handle parse failures
                }
            }

            // Parse ontology YAML -> builder objects + links
            if (files.ontology) {
                try {
                    const ontologyYaml = yaml.load(files.ontology) as Record<
                        string,
                        unknown
                    >;
                    const objectsMap =
                        (ontologyYaml?.objects as Record<string, unknown>) ??
                        {};

                    let objIdx = 0;
                    const objectIdMap: Record<string, string> = {};

                    for (const [objName, objData] of Object.entries(
                        objectsMap,
                    )) {
                        const data = objData as Record<string, unknown>;
                        const propsData =
                            (data.properties as Record<string, unknown>) ?? {};

                        let propIdx = 0;
                        const properties: ObjectProperty[] = [];

                        for (const [propName, propData] of Object.entries(
                            propsData,
                        )) {
                            const pd = propData as Record<string, unknown>;
                            let kind: PropertyKind = 'backing';
                            let ref = '';
                            let additionalMappings: SourceMapping[] | undefined;

                            if (pd.kind === 'system') {
                                kind = 'system';
                            } else if (pd.backing) {
                                kind = 'backing';
                                if (Array.isArray(pd.backing)) {
                                    // Multi-source format
                                    const entries = pd.backing as Array<
                                        Record<string, string>
                                    >;
                                    if (entries.length > 0) {
                                        const first = entries[0];
                                        const src = first.source ?? '';
                                        const fld = first.field ?? '';
                                        ref =
                                            src && fld
                                                ? `${src}.${fld}`
                                                : src || fld || '';
                                    }
                                    if (entries.length > 1) {
                                        additionalMappings = entries
                                            .slice(1)
                                            .map((e) => {
                                                const s = e.source ?? '';
                                                const f = e.field ?? '';
                                                const r =
                                                    s && f
                                                        ? `${s}.${f}`
                                                        : s || f || '';
                                                return {
                                                    ref: r,
                                                    ...(e.transform
                                                        ? {
                                                              transform:
                                                                  e.transform,
                                                          }
                                                        : {}),
                                                };
                                            });
                                    }
                                } else {
                                    const backing = pd.backing as Record<
                                        string,
                                        string
                                    >;
                                    const src = backing.source ?? '';
                                    const fld = backing.field ?? '';
                                    ref =
                                        src && fld
                                            ? `${src}.${fld}`
                                            : src || fld || '';
                                }
                            } else if (pd.derived) {
                                const derived = pd.derived as Record<
                                    string,
                                    string
                                >;
                                ref = derived.event ?? '';
                                kind = 'derived';
                            } else if (pd.computed) {
                                const computed = pd.computed as Record<
                                    string,
                                    string
                                >;
                                ref = computed.formula ?? '';
                                kind = 'computed';
                            } else if (pd.kind !== 'system') {
                                // Naked property (type only, no backing/derived/computed)
                                // — treat as computed placeholder, not backing
                                kind = 'computed';
                                ref = '';
                            }

                            // Map compiler types back to BQ types
                            const typeMap: Record<string, FieldType> = {
                                string: 'STRING',
                                integer: 'INT64',
                                decimal: 'FLOAT64',
                                float: 'FLOAT64',
                                boolean: 'BOOLEAN',
                                timestamp: 'TIMESTAMP',
                                date: 'DATE',
                                json: 'JSON',
                            };

                            properties.push({
                                id: `prop-${objIdx}-${propIdx}`,
                                name: propName,
                                type:
                                    typeMap[(pd.type as string) ?? 'string'] ??
                                    'STRING',
                                kind,
                                ref,
                                ...(additionalMappings?.length
                                    ? { additionalMappings }
                                    : {}),
                            });
                            propIdx++;
                        }

                        const objId = `obj-${objIdx}`;
                        objectIdMap[objName] = objId;

                        newState.objects.push({
                            id: objId,
                            name: objName,
                            properties,
                        });
                        objIdx++;
                    }

                    // Parse links
                    const linksMap =
                        (ontologyYaml?.links as Record<string, unknown>) ?? {};
                    let linkIdx = 0;

                    for (const [, linkData] of Object.entries(linksMap)) {
                        const ld = linkData as Record<string, string>;
                        const fromParts = (ld.from ?? '').split('.');
                        const toParts = (ld.to ?? '').split('.');
                        const srcObjName = fromParts[0];
                        const tgtObjName = toParts[0];

                        newState.links.push({
                            id: `link-${linkIdx}`,
                            sourceObjectId:
                                objectIdMap[srcObjName] ?? srcObjName,
                            targetObjectId:
                                objectIdMap[tgtObjName] ?? tgtObjName,
                            verb: 'RELATES_TO',
                            cardinality:
                                (ld.cardinality?.replace(
                                    /_/g,
                                    '-',
                                ) as ObjectLink['cardinality']) ??
                                'one-to-many',
                        });
                        linkIdx++;
                    }
                } catch {
                    // Silently handle parse failures
                }
            }

            // Parse tracking plan YAML -> builder events + meta
            if (files.tracking_plan) {
                try {
                    const tpYaml = yaml.load(files.tracking_plan) as Record<
                        string,
                        unknown
                    >;
                    const eventsMap =
                        (tpYaml?.events as Record<string, unknown>) ?? {};

                    // Preserve tracking plan meta (categories, validation, identity)
                    const tpMeta: TrackingPlanMeta = {
                        categories:
                            (tpYaml?.categories as Record<string, unknown>) ??
                            {},
                        ...(tpYaml?.validation
                            ? {
                                  validation: tpYaml.validation as Record<
                                      string,
                                      unknown
                                  >,
                              }
                            : {}),
                        ...(tpYaml?.identity
                            ? {
                                  identity: tpYaml.identity as Record<
                                      string,
                                      unknown
                                  >,
                              }
                            : {}),
                    };
                    if (
                        Object.keys(tpMeta.categories).length > 0 ||
                        tpMeta.validation ||
                        tpMeta.identity
                    ) {
                        newState.trackingPlanMeta = tpMeta;
                    }

                    let evtIdx = 0;
                    for (const [evtName, evtData] of Object.entries(
                        eventsMap,
                    )) {
                        const data = evtData as Record<string, unknown>;
                        const propsData =
                            (data.properties as Record<string, unknown>) ?? {};

                        const categoryMap: Record<string, EventCategory> = {
                            navigation: 'page_view',
                            ecommerce: 'track',
                            email: 'identify',
                        };

                        let propIdx = 0;
                        const properties: EventProperty[] = [];
                        for (const [propName, propData] of Object.entries(
                            propsData,
                        )) {
                            const pd = propData as Record<string, unknown>;
                            const typeMap: Record<string, FieldType> = {
                                string: 'STRING',
                                integer: 'INT64',
                                decimal: 'FLOAT64',
                                float: 'FLOAT64',
                                boolean: 'BOOLEAN',
                                timestamp: 'TIMESTAMP',
                                date: 'DATE',
                                json: 'JSON',
                                array: 'JSON',
                            };
                            properties.push({
                                id: `evtprop-${evtIdx}-${propIdx}`,
                                name: propName,
                                type:
                                    typeMap[(pd.type as string) ?? 'string'] ??
                                    'STRING',
                                required: (pd.required as boolean) ?? false,
                            });
                            propIdx++;
                        }

                        // Parse enriches -> enrichments
                        const enriches = (data.enriches as string[]) ?? [];
                        const enrichments: EnrichmentMapping[] = enriches
                            .map((eRef) => {
                                const objName = eRef.replace('$objects.', '');
                                const obj = newState.objects.find(
                                    (o) => o.name === objName,
                                );
                                if (!obj) return null;
                                return {
                                    eventPropertyId: properties[0]?.id ?? '',
                                    objectId: obj.id,
                                    objectPropertyName:
                                        obj.properties[0]?.name ?? '',
                                };
                            })
                            .filter((e): e is EnrichmentMapping => e !== null);

                        const sourceRef = (data.source as string) ?? '';
                        const inferCollectionMethod = (
                            src: string,
                        ): CollectionMethod => {
                            const sourceKey = src
                                .replace('$sources.', '')
                                .split('.')[0];
                            if (sourceKey === 'browser_events')
                                return 'browser';
                            const matched = newState.sources.find(
                                (s) => s.source_name === sourceKey,
                            );
                            if (matched?.source_type === 'webhook')
                                return 'webhook';
                            if (matched?.source_type === 'pubsub')
                                return 'browser';
                            if (matched?.tap?.startsWith('webhook-'))
                                return 'webhook';
                            if (matched?.tap?.startsWith('tap-'))
                                return 'api_pull';
                            return 'webhook';
                        };

                        newState.events.push({
                            id: `evt-${evtIdx}`,
                            name: evtName,
                            category:
                                categoryMap[(data.category as string) ?? ''] ??
                                'track',
                            collectionMethod: inferCollectionMethod(sourceRef),
                            source: sourceRef,
                            properties,
                            enrichments,
                            // Preserve per-event metadata from YAML
                            ...(data.attribution
                                ? {
                                      attribution: data.attribution as Record<
                                          string,
                                          unknown
                                      >,
                                  }
                                : {}),
                            ...(data.revenue_impact
                                ? {
                                      revenueImpact:
                                          data.revenue_impact as string,
                                  }
                                : {}),
                            ...(data.tests
                                ? {
                                      tests: data.tests as Array<
                                          Record<string, unknown>
                                      >,
                                  }
                                : {}),
                            ...(data.trigger
                                ? { trigger: data.trigger as string }
                                : {}),
                            ...(data.description
                                ? { description: data.description as string }
                                : {}),
                        });
                        evtIdx++;
                    }
                } catch {
                    // Silently handle parse failures
                }
            }

            setState(newState);
        },
        [catalogs],
    );

    // ─── Persistence ───

    const saveClient = useCallback(async () => {
        if (!projectUuid) return;
        const name = clientName ?? 'preview';
        setIsSaving(true);
        try {
            const payload = toCompilerPayload(state, name);
            await Promise.all([
                saveOntologyYamlMutation.mutateAsync({
                    fileKey: 'ontology',
                    content: payload.ontology,
                }),
                saveOntologyYamlMutation.mutateAsync({
                    fileKey: 'sources',
                    content: payload.sources,
                }),
                saveOntologyYamlMutation.mutateAsync({
                    fileKey: 'tracking_plan',
                    content: payload.tracking_plan,
                }),
            ]);
            setIsDirty(false);
            setLastSaved(new Date());
        } finally {
            setIsSaving(false);
        }
    }, [clientName, projectUuid, state, saveOntologyYamlMutation]);

    // Auto-load ontology data when project binding resolves.
    // Depends on loadFromTemplate so it re-runs when catalogs arrive
    // (loadFromTemplate's useCallback deps include catalogs).
    useEffect(() => {
        if (ontologyData && !isAutoLoading && !isDirty) {
            setIsAutoLoading(true);
            const files = ontologyData.files ?? ontologyData;
            loadFromTemplate(files as Record<string, string>);
            setIsDirty(false);
            setLastSaved(null);
            setIsAutoLoading(false);
        }
    }, [ontologyData, loadFromTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Validation ───

    const validationMessages = useMemo<ValidationMessage[]>(() => {
        const messages: ValidationMessage[] = [];

        // Sources validation
        const selectedSources = state.sources.filter((s) =>
            s.streams.some((st) => st.selected),
        );
        if (selectedSources.length === 0) {
            messages.push({
                severity: 'warning',
                tab: 'sources',
                message:
                    'No sources selected. Select at least one connector stream.',
            });
        }

        // Objects validation
        if (state.objects.length === 0) {
            messages.push({
                severity: 'warning',
                tab: 'ontology',
                message: 'No objects defined. Create at least one object.',
            });
        }

        state.objects.forEach((obj) => {
            if (obj.properties.length === 0) {
                messages.push({
                    severity: 'error',
                    tab: 'ontology',
                    message: `Object "${obj.name}" has no properties.`,
                });
            }
        });

        // Events validation
        state.events.forEach((event) => {
            if (event.properties.length === 0) {
                messages.push({
                    severity: 'warning',
                    tab: 'tracking-plan',
                    message: `Event "${event.name}" has no properties.`,
                });
            }
        });

        // Exclusion conflict validation (metric+segment combos)
        for (const source of state.sources) {
            for (const stream of source.streams) {
                if (!stream.selected) continue;
                const selectedFields = stream.fields.filter((f) => f.selected);
                const conflicts = computeExclusionConflicts(selectedFields);
                for (const conflict of conflicts) {
                    messages.push({
                        severity: 'error',
                        tab: 'sources',
                        message: `[${source.label} / ${stream.name}] ${conflict.message}`,
                    });
                }
            }
        }

        // Stale field validation (YAML-only fields not in current catalog)
        for (const source of state.sources) {
            for (const stream of source.streams) {
                const staleSelected = stream.fields.filter(
                    (f) => f.stale && f.selected,
                );
                if (staleSelected.length > 0) {
                    messages.push({
                        severity: 'warning',
                        tab: 'sources',
                        message: `[${source.label} / ${stream.name}] ${staleSelected.length} field(s) not found in catalog: ${staleSelected.map((f) => f.name).join(', ')}`,
                    });
                }
            }
        }

        // Merge compiler validation issues
        if (compilerValidation?.issues) {
            for (const issue of compilerValidation.issues) {
                messages.push({
                    severity: issue.severity === 'error' ? 'error' : 'warning',
                    tab: 'ontology', // Compiler issues are cross-tab, show in ontology
                    message: `[Compiler] ${issue.message}`,
                });
            }
        }

        return messages;
    }, [state, compilerValidation]);

    // Auto-sync sources from ontology refs
    useAutoSourceSync(state, setSources, catalogs);

    return {
        state,
        setState,
        setSources,
        toggleStream,
        toggleField,
        addObject,
        updateObject,
        removeObject,
        addProperty,
        removeProperty,
        addLink,
        removeLink,
        addEvent,
        updateEvent,
        removeEvent,
        addEventProperty,
        addEnrichment,
        validationMessages,
        compilerValidation,
        setCompilerValidation,
        isValidating,
        setIsValidating,
        isCompiling,
        setIsCompiling,
        loadFromTemplate,
        clientName,
        setClientName,
        isDirty,
        lastSaved,
        isSaving,
        isAutoLoading,
        saveClient,
    };
}
