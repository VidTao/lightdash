import {
    ActionIcon,
    Badge,
    Button,
    Checkbox,
    Code,
    CopyButton,
    Group,
    NativeSelect,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconClipboard, IconCheck, IconPlus, IconTrash } from '@tabler/icons-react';
import { useCallback, useMemo, useState, type FC } from 'react';
import { generateFullSnippet } from './snippetGenerator';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './WorkshopBuilder.module.css';
import type {
    CollectionMethod,
    EnrichmentMapping,
    EventCategory,
    EventProperty,
    FieldType,
    OntologyObject,
    TrackingEvent,
} from './types';

type Props = {
    events: TrackingEvent[];
    objects: OntologyObject[];
    addEvent: (event: TrackingEvent) => void;
    updateEvent: (id: string, updates: Partial<TrackingEvent>) => void;
    removeEvent: (id: string) => void;
    addEventProperty: (eventId: string, prop: EventProperty) => void;
    addEnrichment: (eventId: string, enrichment: EnrichmentMapping) => void;
};

const EVENT_CATEGORIES: EventCategory[] = [
    'page_view',
    'identify',
    'track',
    'group',
];
const COLLECTION_METHODS: CollectionMethod[] = [
    'browser',
    'webhook',
    'api_pull',
];
const FIELD_TYPES: FieldType[] = [
    'STRING',
    'INT64',
    'FLOAT64',
    'BOOLEAN',
    'TIMESTAMP',
];

let nextId = 1;
const genId = (prefix: string) => `${prefix}-${nextId++}`;

const CATEGORY_COLORS: Record<EventCategory, string> = {
    page_view: 'blue',
    identify: 'teal',
    track: 'violet',
    group: 'orange',
};

const COLLECTION_METHOD_COLORS: Record<CollectionMethod, string> = {
    browser: 'blue',
    webhook: 'green',
    api_pull: 'gray',
};

const SNIPPET_TITLES: Record<CollectionMethod, string> = {
    browser: 'Tracking Snippet',
    webhook: 'Webhook Payload',
    api_pull: 'Data Source',
};

const TrackingPlanBuilder: FC<Props> = ({
    events,
    objects,
    addEvent,
    updateEvent,
    removeEvent,
    addEventProperty,
    addEnrichment,
}) => {
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [newEventName, setNewEventName] = useState('');
    const [newEventCategory] = useState<EventCategory>('track');
    const [newCollectionMethod, setNewCollectionMethod] =
        useState<CollectionMethod>('browser');

    // Property form state
    const [newPropName, setNewPropName] = useState('');
    const [newPropType, setNewPropType] = useState<FieldType>('STRING');
    const [newPropRequired, setNewPropRequired] = useState(true);

    // Enrichment form state
    const [enrichObjId, setEnrichObjId] = useState('');
    const [enrichObjProp, setEnrichObjProp] = useState('');
    const [enrichEventPropId, setEnrichEventPropId] = useState('');

    const selectedEvent = events.find((e) => e.id === selectedEventId);

    const handleAddEvent = useCallback(() => {
        if (!newEventName.trim()) return;
        const id = genId('evt');
        addEvent({
            id,
            name: newEventName.trim(),
            category: newEventCategory,
            collectionMethod: newCollectionMethod,
            source: '',
            properties: [],
            enrichments: [],
        });
        setSelectedEventId(id);
        setNewEventName('');
    }, [newEventName, newEventCategory, newCollectionMethod, addEvent]);

    const handleAddProperty = useCallback(() => {
        if (!selectedEventId || !newPropName.trim()) return;
        addEventProperty(selectedEventId, {
            id: genId('eprop'),
            name: newPropName.trim(),
            type: newPropType,
            required: newPropRequired,
        });
        setNewPropName('');
    }, [
        selectedEventId,
        newPropName,
        newPropType,
        newPropRequired,
        addEventProperty,
    ]);

    const handleAddEnrichment = useCallback(() => {
        if (
            !selectedEventId ||
            !enrichObjId ||
            !enrichObjProp ||
            !enrichEventPropId
        )
            return;
        addEnrichment(selectedEventId, {
            eventPropertyId: enrichEventPropId,
            objectId: enrichObjId,
            objectPropertyName: enrichObjProp,
        });
        setEnrichObjProp('');
        setEnrichEventPropId('');
    }, [
        selectedEventId,
        enrichObjId,
        enrichObjProp,
        enrichEventPropId,
        addEnrichment,
    ]);

    const selectedEnrichObject = objects.find((o) => o.id === enrichObjId);

    const snippet = useMemo(() => {
        if (!selectedEvent) return '';
        return generateFullSnippet(selectedEvent);
    }, [selectedEvent]);

    return (
        <div className={styles.builderLayout}>
            {/* Left: Event list */}
            <div className={styles.leftPanel}>
                <Stack spacing={12}>
                    <Title order={5}>Events</Title>
                    <Group spacing={8}>
                        <TextInput
                            placeholder="Event name..."
                            value={newEventName}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setNewEventName(e.currentTarget.value)}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') handleAddEvent();
                            }}
                            size="sm"
                            style={{ flex: 1 }}
                        />
                        <NativeSelect
                            size="sm"
                            value={newCollectionMethod}
                            onChange={(
                                e: React.ChangeEvent<HTMLSelectElement>,
                            ) =>
                                setNewCollectionMethod(
                                    e.currentTarget.value as CollectionMethod,
                                )
                            }
                            data={COLLECTION_METHODS}
                            style={{ width: 110 }}
                        />
                        <Button
                            size="sm"
                            variant="light"
                            onClick={handleAddEvent}
                            disabled={!newEventName.trim()}
                        >
                            <IconPlus size={16} />
                        </Button>
                    </Group>

                    <ScrollArea h="calc(100vh - 220px)">
                        <Stack spacing={6}>
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    className={`${styles.eventCard} ${
                                        selectedEventId === event.id
                                            ? styles.eventCardSelected
                                            : ''
                                    }`}
                                    onClick={() => setSelectedEventId(event.id)}
                                >
                                    <Group position="apart">
                                        <Stack spacing={2}>
                                            <Text size="sm" weight={500}>
                                                {event.name}
                                            </Text>
                                            <Group spacing={4}>
                                                <Badge
                                                    size="xs"
                                                    color={
                                                        COLLECTION_METHOD_COLORS[
                                                            event.collectionMethod
                                                        ]
                                                    }
                                                    variant="filled"
                                                >
                                                    {event.collectionMethod}
                                                </Badge>
                                                <Badge
                                                    size="xs"
                                                    color={
                                                        CATEGORY_COLORS[
                                                            event.category
                                                        ]
                                                    }
                                                    variant="light"
                                                >
                                                    {event.category}
                                                </Badge>
                                            </Group>
                                        </Stack>
                                        <ActionIcon
                                            size="xs"
                                            color="red"
                                            variant="subtle"
                                            onClick={(e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                removeEvent(event.id);
                                                if (
                                                    selectedEventId === event.id
                                                ) {
                                                    setSelectedEventId(null);
                                                }
                                            }}
                                        >
                                            <IconTrash size={12} />
                                        </ActionIcon>
                                    </Group>
                                </div>
                            ))}
                            {events.length === 0 && (
                                <Text color="dimmed" size="sm" align="center">
                                    No events yet. Create one above.
                                </Text>
                            )}
                        </Stack>
                    </ScrollArea>
                </Stack>
            </div>

            {/* Right: Properties + Enrichments */}
            <div className={styles.mainPanel}>
                {selectedEvent ? (
                    <Stack spacing={24}>
                        {/* Event header */}
                        <Group position="apart">
                            <Group spacing={8}>
                                <Title order={5}>{selectedEvent.name}</Title>
                                <Badge
                                    color={
                                        COLLECTION_METHOD_COLORS[
                                            selectedEvent.collectionMethod
                                        ]
                                    }
                                    variant="filled"
                                    size="sm"
                                >
                                    {selectedEvent.collectionMethod}
                                </Badge>
                                <Badge
                                    color={
                                        CATEGORY_COLORS[selectedEvent.category]
                                    }
                                    variant="light"
                                >
                                    {selectedEvent.category}
                                </Badge>
                            </Group>
                            <Group spacing={8}>
                                <NativeSelect
                                    size="xs"
                                    value={selectedEvent.collectionMethod}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>,
                                    ) =>
                                        updateEvent(selectedEvent.id, {
                                            collectionMethod: e.currentTarget
                                                .value as CollectionMethod,
                                        })
                                    }
                                    data={COLLECTION_METHODS}
                                    style={{ width: 110 }}
                                />
                                <NativeSelect
                                    size="xs"
                                    value={selectedEvent.category}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>,
                                    ) =>
                                        updateEvent(selectedEvent.id, {
                                            category: e.currentTarget
                                                .value as EventCategory,
                                        })
                                    }
                                    data={EVENT_CATEGORIES}
                                    style={{ width: 120 }}
                                />
                            </Group>
                        </Group>

                        {/* Properties */}
                        <Stack spacing={8}>
                            <Title order={6}>Properties</Title>
                            {selectedEvent.properties.map((prop) => (
                                <div key={prop.id} className={styles.fieldRow}>
                                    <Text
                                        size="sm"
                                        weight={500}
                                        style={{ flex: 1 }}
                                    >
                                        {prop.name}
                                    </Text>
                                    <Badge
                                        size="xs"
                                        color="gray"
                                        variant="outline"
                                    >
                                        {prop.type}
                                    </Badge>
                                    {prop.required && (
                                        <Badge
                                            size="xs"
                                            color="red"
                                            variant="light"
                                        >
                                            required
                                        </Badge>
                                    )}
                                </div>
                            ))}

                            <Group spacing={8} mt={8}>
                                <TextInput
                                    placeholder="Property name"
                                    size="xs"
                                    value={newPropName}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => setNewPropName(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                />
                                <NativeSelect
                                    size="xs"
                                    value={newPropType}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>,
                                    ) =>
                                        setNewPropType(
                                            e.currentTarget.value as FieldType,
                                        )
                                    }
                                    data={FIELD_TYPES}
                                    style={{ width: 110 }}
                                />
                                <Checkbox
                                    size="xs"
                                    label="Required"
                                    checked={newPropRequired}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) =>
                                        setNewPropRequired(
                                            e.currentTarget.checked,
                                        )
                                    }
                                />
                                <Button
                                    size="xs"
                                    variant="light"
                                    onClick={handleAddProperty}
                                    disabled={!newPropName.trim()}
                                >
                                    Add
                                </Button>
                            </Group>
                        </Stack>

                        {/* Enrichments */}
                        <Stack spacing={8}>
                            <Title order={6}>Enrichments</Title>
                            <Text size="xs" color="dimmed">
                                Map event properties to ontology objects they
                                enrich.
                            </Text>
                            {selectedEvent.enrichments.map((enrich, i) => {
                                const obj = objects.find(
                                    (o) => o.id === enrich.objectId,
                                );
                                const evtProp = selectedEvent.properties.find(
                                    (p) => p.id === enrich.eventPropertyId,
                                );
                                return (
                                    <Group key={i} spacing={8}>
                                        <Badge
                                            size="xs"
                                            color="violet"
                                            variant="light"
                                        >
                                            {evtProp?.name ?? '?'}
                                        </Badge>
                                        <Text size="xs">→</Text>
                                        <Badge
                                            size="xs"
                                            color="green"
                                            variant="light"
                                        >
                                            {obj?.name ?? '?'}.
                                            {enrich.objectPropertyName}
                                        </Badge>
                                    </Group>
                                );
                            })}

                            {objects.length > 0 &&
                                selectedEvent.properties.length > 0 && (
                                    <Group spacing={8} mt={8}>
                                        <NativeSelect
                                            size="xs"
                                            value={enrichEventPropId}
                                            onChange={(
                                                e: React.ChangeEvent<HTMLSelectElement>,
                                            ) =>
                                                setEnrichEventPropId(
                                                    e.currentTarget.value,
                                                )
                                            }
                                            data={[
                                                {
                                                    value: '',
                                                    label: 'Event prop...',
                                                },
                                                ...selectedEvent.properties.map(
                                                    (p) => ({
                                                        value: p.id,
                                                        label: p.name,
                                                    }),
                                                ),
                                            ]}
                                            style={{ width: 130 }}
                                        />
                                        <Text size="xs">→</Text>
                                        <NativeSelect
                                            size="xs"
                                            value={enrichObjId}
                                            onChange={(
                                                e: React.ChangeEvent<HTMLSelectElement>,
                                            ) => {
                                                setEnrichObjId(
                                                    e.currentTarget.value,
                                                );
                                                setEnrichObjProp('');
                                            }}
                                            data={[
                                                {
                                                    value: '',
                                                    label: 'Object...',
                                                },
                                                ...objects.map((o) => ({
                                                    value: o.id,
                                                    label: o.name,
                                                })),
                                            ]}
                                            style={{ width: 130 }}
                                        />
                                        {selectedEnrichObject && (
                                            <NativeSelect
                                                size="xs"
                                                value={enrichObjProp}
                                                onChange={(
                                                    e: React.ChangeEvent<HTMLSelectElement>,
                                                ) =>
                                                    setEnrichObjProp(
                                                        e.currentTarget.value,
                                                    )
                                                }
                                                data={[
                                                    {
                                                        value: '',
                                                        label: 'Property...',
                                                    },
                                                    ...selectedEnrichObject.properties.map(
                                                        (p) => ({
                                                            value: p.name,
                                                            label: p.name,
                                                        }),
                                                    ),
                                                ]}
                                                style={{ width: 130 }}
                                            />
                                        )}
                                        <Button
                                            size="xs"
                                            variant="light"
                                            onClick={handleAddEnrichment}
                                            disabled={
                                                !enrichObjId ||
                                                !enrichObjProp ||
                                                !enrichEventPropId
                                            }
                                        >
                                            Map
                                        </Button>
                                    </Group>
                                )}
                        </Stack>

                        {/* Tracking Code Snippet / Webhook Payload */}
                        <Stack spacing={8}>
                            <Group position="apart">
                                <Title order={6}>
                                    {SNIPPET_TITLES[
                                        selectedEvent.collectionMethod
                                    ] ?? 'Tracking Snippet'}
                                </Title>
                                <CopyButton value={snippet}>
                                    {({ copied, copy }) => (
                                        <Button
                                            size="xs"
                                            variant="subtle"
                                            color={copied ? 'teal' : 'gray'}
                                            leftIcon={
                                                copied ? (
                                                    <IconCheck size={14} />
                                                ) : (
                                                    <IconClipboard size={14} />
                                                )
                                            }
                                            onClick={copy}
                                        >
                                            {copied ? 'Copied' : 'Copy'}
                                        </Button>
                                    )}
                                </CopyButton>
                            </Group>
                            <Code block style={{ fontSize: 12 }}>
                                {snippet}
                            </Code>
                        </Stack>
                    </Stack>
                ) : (
                    <Stack
                        align="center"
                        sx={{ justifyContent: 'center', height: '100%' }}
                    >
                        <Text color="dimmed" size="lg">
                            Select or create an event to edit
                        </Text>
                    </Stack>
                )}
            </div>
        </div>
    );
};

export default TrackingPlanBuilder;
