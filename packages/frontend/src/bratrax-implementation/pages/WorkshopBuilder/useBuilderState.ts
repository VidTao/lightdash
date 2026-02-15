import yaml from 'js-yaml';
import { useCallback, useMemo, useState } from 'react';
import type { ValidateResult } from '../../hooks/useBratraxApi';
import {
    useBratraxCatalogs,
    type CatalogEntry,
} from '../../hooks/useBratraxCatalogs';
import { useBratraxSaveYaml } from '../../hooks/useBratraxClients';
import { toCompilerPayload } from './compilerYamlTransformer';
import type {
    BuilderState,
    EnrichmentMapping,
    EventCategory,
    EventProperty,
    FieldType,
    ObjectLink,
    ObjectProperty,
    OntologyObject,
    PropertyKind,
    SourceConnector,
    TrackingEvent,
    ValidationMessage,
} from './types';
import { useAutoSourceSync } from './useAutoSourceSync';

const INITIAL_STATE: BuilderState = {
    sources: [],
    objects: [],
    links: [],
    events: [],
};

export function useBuilderState() {
    const [state, setState] = useState<BuilderState>(INITIAL_STATE);
    const [compilerValidation, setCompilerValidation] =
        useState<ValidateResult | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isCompiling, setIsCompiling] = useState(false);
    const [clientName, setClientName] = useState<string | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const saveYamlMutation = useBratraxSaveYaml();

    // Wrap setState to track dirty state
    const setDirtyState = useCallback(
        (updater: BuilderState | ((prev: BuilderState) => BuilderState)) => {
            setState(updater);
            setIsDirty(true);
        },
        [],
    );

    // Catalog data for template loading and auto-sync
    const { data: catalogsData } = useBratraxCatalogs();
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
                                    (sd.fields as Record<string, string>) ?? {};
                                const fields = Object.entries(fieldsData).map(
                                    ([fieldName, fieldType]) => ({
                                        name: fieldName,
                                        type: fieldType as FieldType,
                                        selected: true,
                                    }),
                                );
                                return {
                                    name: streamName,
                                    fields,
                                    selected: true,
                                };
                            },
                        );

                        newState.sources.push({
                            tap,
                            label:
                                catalogEntry?.label ??
                                srcName
                                    .replace(/_/g, ' ')
                                    .replace(/\b\w/g, (c) => c.toUpperCase()),
                            category:
                                (catalogEntry?.category as SourceConnector['category']) ??
                                ((data.type as string) === 'pubsub'
                                    ? 'analytics'
                                    : 'other'),
                            available: true,
                            streams,
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

                            if (pd.backing) {
                                const backing = pd.backing as Record<
                                    string,
                                    string
                                >;
                                ref = `${backing.source}.${backing.field}`;
                                kind = 'backing';
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

            // Parse tracking plan YAML -> builder events
            if (files.tracking_plan) {
                try {
                    const tpYaml = yaml.load(files.tracking_plan) as Record<
                        string,
                        unknown
                    >;
                    const eventsMap =
                        (tpYaml?.events as Record<string, unknown>) ?? {};

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
                            .map((ref) => {
                                const objName = ref.replace('$objects.', '');
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

                        newState.events.push({
                            id: `evt-${evtIdx}`,
                            name: evtName,
                            category:
                                categoryMap[(data.category as string) ?? ''] ??
                                'track',
                            properties,
                            enrichments,
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
        if (!clientName) return;
        setIsSaving(true);
        try {
            const payload = toCompilerPayload(state, clientName);
            await Promise.all([
                saveYamlMutation.mutateAsync({
                    clientName,
                    fileKey: 'ontology',
                    content: payload.ontology,
                }),
                saveYamlMutation.mutateAsync({
                    clientName,
                    fileKey: 'sources',
                    content: payload.sources,
                }),
                saveYamlMutation.mutateAsync({
                    clientName,
                    fileKey: 'tracking_plan',
                    content: payload.tracking_plan,
                }),
            ]);
            setIsDirty(false);
            setLastSaved(new Date());
        } finally {
            setIsSaving(false);
        }
    }, [clientName, state, saveYamlMutation]);

    const loadClient = useCallback(
        async (name: string) => {
            const response = await fetch(`/api/v1/bratrax/clients/${name}`);
            if (!response.ok) {
                throw new Error(`Failed to load client: ${response.status}`);
            }
            const json = await response.json();
            const files = json.results?.files ?? json.results ?? {};
            loadFromTemplate(files);
            setClientName(name);
            setIsDirty(false);
            setLastSaved(null);
        },
        [loadFromTemplate],
    );

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
        saveClient,
        loadClient,
    };
}
