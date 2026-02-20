/**
 * Unified autocomplete input for all non-system property kinds.
 * Renders an inline Autocomplete with context-aware suggestions
 * and a browse button to open the FieldRefPicker modal.
 *
 * Backing suggestions are built from loaded sources (correct stream names)
 * supplemented by catalog data for sources not yet loaded.
 */
import { ActionIcon, Autocomplete } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useMemo, useState, type FC } from 'react';
import {
    useBratraxCatalogs,
    type CatalogEntry,
} from '../../hooks/useBratraxCatalogs';
import type {
    FieldType,
    OntologyObject,
    PropertyKind,
    SourceConnector,
    TrackingEvent,
} from './types';

type AutocompleteItem = {
    value: string;
    group?: string;
};

type PropertyRefInputProps = {
    kind: PropertyKind;
    value: string;
    onChange: (ref: string, fieldType?: FieldType) => void;
    onOpenPicker: () => void;
    objects: OntologyObject[];
    events: TrackingEvent[];
    sources: SourceConnector[];
    projectUuid?: string;
};

const SQL_PATTERNS: AutocompleteItem[] = [
    { value: 'SUM()', group: 'SQL Patterns' },
    { value: 'COUNT()', group: 'SQL Patterns' },
    { value: 'AVG()', group: 'SQL Patterns' },
    { value: 'MIN()', group: 'SQL Patterns' },
    { value: 'MAX()', group: 'SQL Patterns' },
    { value: 'COALESCE()', group: 'SQL Patterns' },
    { value: 'NULLIF()', group: 'SQL Patterns' },
    { value: 'CASE WHEN  THEN  ELSE  END', group: 'SQL Patterns' },
];

const PLACEHOLDER_BY_KIND: Record<string, string> = {
    backing: 'e.g. $sources.shopify.orders.email',
    derived: 'e.g. $events.order_completed',
    computed: 'e.g. SUM(payment_allocation.amount)',
};

function inferFieldType(ref: string): FieldType | undefined {
    const lower = ref.toLowerCase();
    if (
        lower.startsWith('sum(') ||
        lower.startsWith('avg(') ||
        lower.startsWith('count(')
    ) {
        return 'FLOAT64';
    }
    if (lower.startsWith('$events.')) {
        return 'STRING';
    }
    return undefined;
}

/**
 * Build backing suggestions primarily from loaded sources (which have correct
 * YAML stream names like "sold_unsold"), then supplement with catalog data
 * for any sources not already loaded.
 */
function buildBackingSuggestions(
    sources: SourceConnector[],
    catalogs: CatalogEntry[],
): AutocompleteItem[] {
    const items: AutocompleteItem[] = [];
    const coveredTaps = new Set<string>();

    // Primary: loaded sources with correct stream names
    for (const src of sources) {
        coveredTaps.add(src.tap);
        const sourceName =
            src.source_name ?? src.tap.replace(/^(tap-|webhook-)/, '');
        for (const stream of src.streams) {
            for (const field of stream.fields) {
                items.push({
                    value: `$sources.${sourceName}.${stream.name}.${field.name}`,
                    group: src.label,
                });
            }
        }
    }

    // Supplement: catalog sources not yet loaded
    for (const catalog of catalogs) {
        if (coveredTaps.has(catalog.tap)) continue;
        const sourceName =
            catalog.source_name ?? catalog.tap.replace('tap-', '');
        for (const stream of catalog.streams) {
            for (const field of stream.fields) {
                items.push({
                    value: `$sources.${sourceName}.${stream.name}.${field.name}`,
                    group: catalog.label,
                });
            }
        }
    }

    return items;
}

function buildDerivedSuggestions(events: TrackingEvent[]): AutocompleteItem[] {
    return events.map((event) => ({
        value: `$events.${event.name}`,
        group: event.category,
    }));
}

function buildComputedSuggestions(
    objects: OntologyObject[],
): AutocompleteItem[] {
    const items: AutocompleteItem[] = [];
    for (const obj of objects) {
        for (const prop of obj.properties) {
            items.push({
                value: `${obj.name}.${prop.name}`,
                group: obj.name,
            });
        }
    }
    return [...items, ...SQL_PATTERNS];
}

const PropertyRefInput: FC<PropertyRefInputProps> = ({
    kind,
    value,
    onChange,
    onOpenPicker,
    objects,
    events,
    sources,
    projectUuid,
}) => {
    const { data: catalogsData } = useBratraxCatalogs(projectUuid);

    const [inputValue, setInputValue] = useState(value);

    // Sync external value changes (e.g. kind change clearing the ref)
    const [prevValue, setPrevValue] = useState(value);
    if (value !== prevValue) {
        setInputValue(value);
        setPrevValue(value);
    }

    const suggestions = useMemo((): AutocompleteItem[] => {
        const catalogs = catalogsData?.catalogs ?? [];
        switch (kind) {
            case 'backing':
                return buildBackingSuggestions(sources, catalogs);
            case 'derived':
                return buildDerivedSuggestions(events);
            case 'computed':
                return buildComputedSuggestions(objects);
            default:
                return [];
        }
    }, [kind, sources, catalogsData, events, objects]);

    return (
        <Autocomplete
            size="xs"
            placeholder={PLACEHOLDER_BY_KIND[kind] ?? ''}
            value={inputValue}
            onChange={setInputValue}
            data={suggestions}
            limit={50}
            maxDropdownHeight={250}
            nothingFound="Type to search..."
            onItemSubmit={(item: AutocompleteItem) => {
                const fieldType = inferFieldType(item.value);
                onChange(item.value, fieldType);
            }}
            onBlur={() => {
                if (inputValue !== value) {
                    const fieldType = inferFieldType(inputValue);
                    onChange(inputValue, fieldType);
                }
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                }
            }}
            rightSection={
                <ActionIcon
                    size="xs"
                    variant="subtle"
                    onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onOpenPicker();
                    }}
                >
                    <IconSearch size={12} />
                </ActionIcon>
            }
            style={{ flex: 1 }}
        />
    );
};

export default PropertyRefInput;
