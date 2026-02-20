/**
 * Auto-sync sources from ontology property refs.
 *
 * When a property ref like $sources.shopify.orders.email is set via the
 * FieldRefPicker, this hook ensures the corresponding source (shopify)
 * is added to the builder state with the referenced stream and field selected.
 */
import { useEffect } from 'react';
import {
    normalizeSingerType,
    type CatalogEntry,
} from '../../hooks/useBratraxCatalogs';
import type { BuilderState, SourceConnector } from './types';

/**
 * Build source_name → tap reverse lookup from catalog entries.
 * No more hardcoded mapping — uses the enriched catalog data.
 */
function buildSourceToTap(
    catalogs: CatalogEntry[],
): Record<string, string> {
    const map: Record<string, string> = {};
    for (const c of catalogs) {
        const sourceName =
            (c as { source_name?: string }).source_name ??
            c.tap.replace('tap-', '');
        map[sourceName] = c.tap;
    }
    return map;
}

type ParsedRef = {
    sourceName: string;
    streamName: string;
    fieldName: string;
};

function parseSourceRef(ref: string): ParsedRef | null {
    if (!ref.startsWith('$sources.')) return null;
    const parts = ref.replace('$sources.', '').split('.');
    if (parts.length < 3) return null;
    return {
        sourceName: parts[0],
        streamName: parts[1],
        fieldName: parts.slice(2).join('.'),
    };
}

// BQ_TYPE_MAP removed — using normalizeSingerType instead

export function useAutoSourceSync(
    state: BuilderState,
    setSources: (sources: SourceConnector[]) => void,
    catalogs: CatalogEntry[] | undefined,
) {
    useEffect(() => {
        if (!catalogs || catalogs.length === 0) return;

        const sourceToTap = buildSourceToTap(catalogs);

        // Collect all $sources refs from ontology properties
        const refsUsed = new Map<string, Set<string>>();
        for (const obj of state.objects) {
            for (const prop of obj.properties) {
                const parsed = parseSourceRef(prop.ref);
                if (!parsed) continue;
                const key = `${parsed.sourceName}.${parsed.streamName}`;
                if (!refsUsed.has(key)) {
                    refsUsed.set(key, new Set());
                }
                refsUsed.get(key)!.add(parsed.fieldName);
            }
        }

        if (refsUsed.size === 0) return;

        let updated = false;
        let newSources = [...state.sources];

        for (const [key, fieldNames] of refsUsed) {
            const [sourceName, streamName] = key.split('.');
            const tapName = sourceToTap[sourceName];
            if (!tapName) continue;

            // Check if source already exists
            const existingSourceIdx = newSources.findIndex(
                (s) => s.tap === tapName,
            );

            if (existingSourceIdx >= 0) {
                // Source exists - ensure stream is selected (immutable update)
                const src = newSources[existingSourceIdx];
                const stream = src.streams.find((s) => s.name === streamName);
                if (stream && !stream.selected) {
                    newSources = newSources.map((s, idx) =>
                        idx === existingSourceIdx
                            ? {
                                  ...s,
                                  streams: s.streams.map((st) =>
                                      st.name === streamName
                                          ? { ...st, selected: true }
                                          : st,
                                  ),
                              }
                            : s,
                    );
                    updated = true;
                }
            } else {
                // Source doesn't exist - create from catalog
                const catalog = catalogs.find((c) => c.tap === tapName);
                if (!catalog) continue;

                const catalogStream = catalog.streams.find(
                    (s) => s.name === streamName,
                );
                if (!catalogStream) continue;

                const streams = catalog.streams.map((s) => ({
                    name: s.name,
                    selected: s.name === streamName,
                    fields: s.fields.map((f) => ({
                        name: f.name,
                        type: normalizeSingerType(f.type),
                        selected:
                            s.name === streamName && fieldNames.has(f.name),
                    })),
                }));

                newSources = [
                    ...newSources,
                    {
                        tap: tapName,
                        label: catalog.label,
                        category:
                            (catalog.category as SourceConnector['category']) ?? 'other',
                        available: true,
                        streams,
                    },
                ];
                updated = true;
            }
        }

        if (updated) {
            setSources(newSources);
        }
    }, [state.objects, catalogs, state.sources, setSources]);
}
