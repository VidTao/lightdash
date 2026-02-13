import { useCallback, useMemo, useState } from 'react';
import type {
    BuilderState,
    EnrichmentMapping,
    EventProperty,
    ObjectLink,
    ObjectProperty,
    OntologyObject,
    SourceConnector,
    TrackingEvent,
    ValidationMessage,
} from './types';

const INITIAL_STATE: BuilderState = {
    sources: [],
    objects: [],
    links: [],
    events: [],
};

export function useBuilderState() {
    const [state, setState] = useState<BuilderState>(INITIAL_STATE);

    // ─── Sources ───

    const setSources = useCallback((sources: SourceConnector[]) => {
        setState((prev) => ({ ...prev, sources }));
    }, []);

    const toggleStream = useCallback((tapName: string, streamName: string) => {
        setState((prev) => ({
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
    }, []);

    const toggleField = useCallback(
        (tapName: string, streamName: string, fieldName: string) => {
            setState((prev) => ({
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
        [],
    );

    // ─── Objects ───

    const addObject = useCallback((obj: OntologyObject) => {
        setState((prev) => ({
            ...prev,
            objects: [...prev.objects, obj],
        }));
    }, []);

    const updateObject = useCallback(
        (objectId: string, updates: Partial<OntologyObject>) => {
            setState((prev) => ({
                ...prev,
                objects: prev.objects.map((o) =>
                    o.id === objectId ? { ...o, ...updates } : o,
                ),
            }));
        },
        [],
    );

    const removeObject = useCallback((objectId: string) => {
        setState((prev) => ({
            ...prev,
            objects: prev.objects.filter((o) => o.id !== objectId),
            links: prev.links.filter(
                (l) =>
                    l.sourceObjectId !== objectId &&
                    l.targetObjectId !== objectId,
            ),
        }));
    }, []);

    const addProperty = useCallback(
        (objectId: string, prop: ObjectProperty) => {
            setState((prev) => ({
                ...prev,
                objects: prev.objects.map((o) =>
                    o.id === objectId
                        ? { ...o, properties: [...o.properties, prop] }
                        : o,
                ),
            }));
        },
        [],
    );

    const removeProperty = useCallback(
        (objectId: string, propertyId: string) => {
            setState((prev) => ({
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
        [],
    );

    // ─── Links ───

    const addLink = useCallback((link: ObjectLink) => {
        setState((prev) => ({
            ...prev,
            links: [...prev.links, link],
        }));
    }, []);

    const removeLink = useCallback((linkId: string) => {
        setState((prev) => ({
            ...prev,
            links: prev.links.filter((l) => l.id !== linkId),
        }));
    }, []);

    // ─── Events ───

    const addEvent = useCallback((event: TrackingEvent) => {
        setState((prev) => ({
            ...prev,
            events: [...prev.events, event],
        }));
    }, []);

    const updateEvent = useCallback(
        (eventId: string, updates: Partial<TrackingEvent>) => {
            setState((prev) => ({
                ...prev,
                events: prev.events.map((e) =>
                    e.id === eventId ? { ...e, ...updates } : e,
                ),
            }));
        },
        [],
    );

    const removeEvent = useCallback((eventId: string) => {
        setState((prev) => ({
            ...prev,
            events: prev.events.filter((e) => e.id !== eventId),
        }));
    }, []);

    const addEventProperty = useCallback(
        (eventId: string, prop: EventProperty) => {
            setState((prev) => ({
                ...prev,
                events: prev.events.map((e) =>
                    e.id === eventId
                        ? { ...e, properties: [...e.properties, prop] }
                        : e,
                ),
            }));
        },
        [],
    );

    const addEnrichment = useCallback(
        (eventId: string, enrichment: EnrichmentMapping) => {
            setState((prev) => ({
                ...prev,
                events: prev.events.map((e) =>
                    e.id === eventId
                        ? { ...e, enrichments: [...e.enrichments, enrichment] }
                        : e,
                ),
            }));
        },
        [],
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

        return messages;
    }, [state]);

    return {
        state,
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
    };
}
