/**
 * 3-column modal for visually browsing real Meltano Singer catalog data
 * and selecting source > stream > field to construct $ref strings.
 *
 * Column 1: Taps (Shopify, Facebook, etc.)
 * Column 2: Streams for selected tap
 * Column 3: Fields for selected stream with types
 */
import {
    Badge,
    Button,
    Group,
    Loader,
    Modal,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Title,
    Tooltip,
} from '@mantine/core';
import { IconAlertTriangle, IconSearch } from '@tabler/icons-react';
import { useCallback, useMemo, useState, type FC } from 'react';
import {
    normalizeSingerType,
    useBratraxCatalogs,
    type CatalogEntry,
    type CatalogField,
    type CatalogStream,
} from '../../hooks/useBratraxCatalogs';
import type { FieldType, PropertyKind, TrackingEvent } from './types';

type FieldRefPickerProps = {
    opened: boolean;
    onClose: () => void;
    onSelect: (ref: string, fieldType: FieldType) => void;
    kind: PropertyKind;
    events?: TrackingEvent[];
};

const BQ_TYPE_MAP: Record<string, FieldType> = {
    STRING: 'STRING',
    INT64: 'INT64',
    FLOAT64: 'FLOAT64',
    BOOLEAN: 'BOOLEAN',
    JSON: 'JSON',
};

const CATEGORY_COLORS: Record<string, string> = {
    ads: 'orange',
    commerce: 'teal',
    crm: 'violet',
    analytics: 'blue',
    database: 'gray',
};

const columnStyle = {
    flex: 1,
    borderRight: '1px solid var(--mantine-color-gray-3)',
    minWidth: 0,
};

const itemStyle = (selected: boolean) => ({
    padding: '6px 10px',
    cursor: 'pointer' as const,
    borderRadius: 4,
    backgroundColor: selected ? 'var(--mantine-color-blue-0)' : 'transparent',
    '&:hover': { backgroundColor: 'var(--mantine-color-gray-0)' },
});

const FieldRefPicker: FC<FieldRefPickerProps> = ({
    opened,
    onClose,
    onSelect,
    kind,
    events = [],
}) => {
    const { data: catalogsData, isLoading } = useBratraxCatalogs();
    const isOffline = catalogsData?.isOffline ?? false;
    const [selectedTap, setSelectedTap] = useState<CatalogEntry | null>(null);
    const [selectedStream, setSelectedStream] = useState<CatalogStream | null>(
        null,
    );
    const [fieldSearch, setFieldSearch] = useState('');
    const [formulaText, setFormulaText] = useState('');

    const catalogs = catalogsData?.catalogs ?? [];

    const filteredFields = useMemo(() => {
        if (!selectedStream) return [];
        if (!fieldSearch) return selectedStream.fields;
        const lower = fieldSearch.toLowerCase();
        return selectedStream.fields.filter((f) =>
            f.name.toLowerCase().includes(lower),
        );
    }, [selectedStream, fieldSearch]);

    const handleFieldSelect = useCallback(
        (field: CatalogField) => {
            if (!selectedTap || !selectedStream) return;
            const sourceName =
                selectedTap.source_name ?? selectedTap.tap.replace('tap-', '');
            const ref = `$sources.${sourceName}.${selectedStream.name}.${field.name}`;
            const fieldType: FieldType = normalizeSingerType(field.type);
            onSelect(ref, fieldType);
            onClose();
            setSelectedTap(null);
            setSelectedStream(null);
            setFieldSearch('');
        },
        [selectedTap, selectedStream, onSelect, onClose],
    );

    const handleEventSelect = useCallback(
        (event: TrackingEvent) => {
            const ref = `$events.${event.name}`;
            onSelect(ref, 'STRING');
            onClose();
        },
        [onSelect, onClose],
    );

    const handleFormulaSubmit = useCallback(() => {
        if (formulaText.trim()) {
            onSelect(formulaText.trim(), 'FLOAT64');
            onClose();
            setFormulaText('');
        }
    }, [formulaText, onSelect, onClose]);

    // System kind: informational — no picker needed
    if (kind === 'system') {
        return (
            <Modal
                opened={opened}
                onClose={onClose}
                title="System Property"
                size="sm"
            >
                <Stack spacing="md">
                    <Text size="sm" color="dimmed">
                        System properties (like client_id) are added by the
                        Bratrax ingestion pipeline to every record before it
                        reaches BigQuery. They exist in all source tables and
                        don't need a source mapping — the compiler reads them
                        directly.
                    </Text>
                    <Button variant="light" onClick={onClose}>
                        Close
                    </Button>
                </Stack>
            </Modal>
        );
    }

    // Computed kind: show formula textarea
    if (kind === 'computed') {
        return (
            <Modal
                opened={opened}
                onClose={onClose}
                title="Computed Property Formula"
                size="md"
            >
                <Stack spacing="md">
                    <Text size="sm" color="dimmed">
                        Enter a SQL formula that references other properties on
                        this object.
                    </Text>
                    <TextInput
                        placeholder="e.g. lifetime_value / NULLIF(orders_count, 0)"
                        value={formulaText}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormulaText(e.currentTarget.value)
                        }
                    />
                    <Button
                        onClick={handleFormulaSubmit}
                        disabled={!formulaText.trim()}
                    >
                        Set Formula
                    </Button>
                </Stack>
            </Modal>
        );
    }

    // Derived kind: show event picker
    if (kind === 'derived') {
        return (
            <Modal
                opened={opened}
                onClose={onClose}
                title="Select Event Reference"
                size="sm"
            >
                <Stack spacing="xs">
                    {events.length === 0 ? (
                        <Text size="sm" color="dimmed">
                            No events defined yet. Create events in the Tracking
                            Plan tab first.
                        </Text>
                    ) : (
                        events.map((event) => (
                            <Button
                                key={event.id}
                                variant="light"
                                size="sm"
                                onClick={() => handleEventSelect(event)}
                                styles={{
                                    root: {
                                        height: 'auto',
                                        padding: '8px 12px',
                                    },
                                    label: {
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        width: '100%',
                                    },
                                }}
                            >
                                <Text size="sm">{event.name}</Text>
                                <Badge size="xs" variant="light">
                                    {event.category}
                                </Badge>
                            </Button>
                        ))
                    )}
                </Stack>
            </Modal>
        );
    }

    // Backing kind: 3-column source picker
    return (
        <Modal
            opened={opened}
            onClose={() => {
                onClose();
                setSelectedTap(null);
                setSelectedStream(null);
                setFieldSearch('');
            }}
            title="Select Source Field"
            size="xl"
        >
            {isLoading ? (
                <Group position="center" py="xl">
                    <Loader size="sm" />
                    <Text size="sm" color="dimmed">
                        Loading catalog data...
                    </Text>
                </Group>
            ) : catalogs.length === 0 ? (
                <Text size="sm" color="dimmed" ta="center" py="xl">
                    {isOffline
                        ? 'Bratrax API is offline. Start it with: cd ontology && python api.py'
                        : 'No catalog data available.'}
                </Text>
            ) : (
                <div style={{ display: 'flex', height: 400, gap: 0 }}>
                    {/* Column 1: Taps */}
                    <div style={columnStyle}>
                        <Title order={6} px={10} py={6}>
                            Sources
                        </Title>
                        <ScrollArea h={360}>
                            <Stack spacing={2} px={4}>
                                {catalogs.map((catalog) => (
                                    <div
                                        key={catalog.tap}
                                        style={itemStyle(
                                            selectedTap?.tap === catalog.tap,
                                        )}
                                        onClick={() => {
                                            setSelectedTap(catalog);
                                            setSelectedStream(null);
                                            setFieldSearch('');
                                        }}
                                    >
                                        <Group spacing={6} position="apart">
                                            <Text size="sm" weight={500}>
                                                {catalog.label}
                                            </Text>
                                            <Badge
                                                size="xs"
                                                color={
                                                    CATEGORY_COLORS[
                                                        catalog.category
                                                    ] ?? 'gray'
                                                }
                                                variant="light"
                                            >
                                                {catalog.streams.length}
                                            </Badge>
                                        </Group>
                                    </div>
                                ))}
                            </Stack>
                        </ScrollArea>
                    </div>

                    {/* Column 2: Streams */}
                    <div style={columnStyle}>
                        <Title order={6} px={10} py={6}>
                            Streams
                        </Title>
                        <ScrollArea h={360}>
                            <Stack spacing={2} px={4}>
                                {selectedTap ? (
                                    selectedTap.streams.map((stream) => (
                                        <div
                                            key={stream.name}
                                            style={itemStyle(
                                                selectedStream?.name ===
                                                    stream.name,
                                            )}
                                            onClick={() => {
                                                setSelectedStream(stream);
                                                setFieldSearch('');
                                            }}
                                        >
                                            <Text size="sm" weight={500}>
                                                {stream.name}
                                            </Text>
                                            <Text size="xs" color="dimmed">
                                                {stream.fields.length} fields
                                            </Text>
                                        </div>
                                    ))
                                ) : (
                                    <Text
                                        size="xs"
                                        color="dimmed"
                                        ta="center"
                                        pt="md"
                                    >
                                        Select a source
                                    </Text>
                                )}
                            </Stack>
                        </ScrollArea>
                    </div>

                    {/* Column 3: Fields */}
                    <div style={{ ...columnStyle, borderRight: 'none' }}>
                        <Group px={10} py={4} spacing={4}>
                            <Title order={6}>Fields</Title>
                            {selectedStream && (
                                <TextInput
                                    size="xs"
                                    placeholder="Filter..."
                                    icon={<IconSearch size={12} />}
                                    value={fieldSearch}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => setFieldSearch(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                />
                            )}
                        </Group>
                        <ScrollArea h={360}>
                            <Stack spacing={2} px={4}>
                                {selectedStream ? (
                                    filteredFields.map((field) => {
                                        const behaviorColor =
                                            field.behavior === 'METRIC'
                                                ? 'blue'
                                                : field.behavior === 'SEGMENT'
                                                  ? 'grape'
                                                  : field.behavior ===
                                                      'ATTRIBUTE'
                                                    ? 'gray'
                                                    : undefined;
                                        return (
                                            <div
                                                key={field.name}
                                                style={{
                                                    ...itemStyle(false),
                                                    display: 'flex',
                                                    justifyContent:
                                                        'space-between',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}
                                                onClick={() =>
                                                    handleFieldSelect(field)
                                                }
                                            >
                                                <Text
                                                    size="sm"
                                                    style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                    }}
                                                    truncate
                                                >
                                                    {field.name}
                                                </Text>
                                                {field.polymorphic && (
                                                    <Tooltip label="Polymorphic — may return NULL for object values">
                                                        <IconAlertTriangle
                                                            size={12}
                                                            color="var(--mantine-color-yellow-6)"
                                                        />
                                                    </Tooltip>
                                                )}
                                                {behaviorColor && (
                                                    <Badge
                                                        size="xs"
                                                        color={behaviorColor}
                                                        variant="light"
                                                    >
                                                        {field.behavior}
                                                    </Badge>
                                                )}
                                                <Badge
                                                    size="xs"
                                                    color="gray"
                                                    variant="outline"
                                                >
                                                    {normalizeSingerType(
                                                        field.type,
                                                    )}
                                                </Badge>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <Text
                                        size="xs"
                                        color="dimmed"
                                        ta="center"
                                        pt="md"
                                    >
                                        Select a stream
                                    </Text>
                                )}
                            </Stack>
                        </ScrollArea>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default FieldRefPicker;
