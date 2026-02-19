import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Group,
    NativeSelect,
    ScrollArea,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconLink, IconPlus, IconTrash } from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
import FieldRefPicker from './FieldRefPicker';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './WorkshopBuilder.module.css';
import type {
    FieldType,
    ObjectLink,
    ObjectProperty,
    OntologyObject,
    PropertyKind,
    SourceMapping,
    TrackingEvent,
} from './types';

type Props = {
    objects: OntologyObject[];
    links: ObjectLink[];
    events: TrackingEvent[];
    addObject: (obj: OntologyObject) => void;
    updateObject: (id: string, updates: Partial<OntologyObject>) => void;
    removeObject: (id: string) => void;
    addProperty: (objectId: string, prop: ObjectProperty) => void;
    removeProperty: (objectId: string, propId: string) => void;
    addLink: (link: ObjectLink) => void;
    removeLink: (linkId: string) => void;
};

const FIELD_TYPES: FieldType[] = [
    'STRING',
    'INT64',
    'FLOAT64',
    'BOOLEAN',
    'TIMESTAMP',
    'DATE',
];
const PROPERTY_KINDS: PropertyKind[] = ['backing', 'derived', 'computed', 'system'];
const CARDINALITIES = ['one-to-one', 'one-to-many', 'many-to-many'] as const;

const OBJECT_PRESETS = [
    {
        name: 'Customer',
        description: 'Person who buys from your store',
        props: ['customer_id', 'email', 'first_name', 'last_name', 'created_at'],
    },
    {
        name: 'Order',
        description: 'A purchase transaction',
        props: ['order_id', 'customer_id', 'total_price', 'created_at', 'status'],
    },
    {
        name: 'Campaign',
        description: 'An advertising campaign',
        props: [
            'campaign_id',
            'campaign_name',
            'status',
            'spend',
            'impressions',
        ],
    },
    {
        name: 'Product',
        description: 'An item in your catalog',
        props: ['product_id', 'title', 'vendor', 'product_type', 'price'],
    },
] as const;

let nextId = 1;
const genId = (prefix: string) => `${prefix}-${nextId++}`;

const OntologyBuilder: FC<Props> = ({
    objects,
    links,
    events,
    addObject,
    updateObject,
    removeObject,
    addProperty,
    removeProperty,
    addLink,
    removeLink,
}) => {
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(
        null,
    );
    const [newObjectName, setNewObjectName] = useState('');
    const [newPropName, setNewPropName] = useState('');
    const [newPropType, setNewPropType] = useState<FieldType>('STRING');
    const [newPropKind, setNewPropKind] = useState<PropertyKind>('backing');
    const [newPropRef, setNewPropRef] = useState('');

    // Field ref picker state — editingPropId is set when editing an existing property
    const [pickerOpen, setPickerOpen] = useState(false);
    const [editingPropId, setEditingPropId] = useState<string | null>(null);
    const [editingPropKind, setEditingPropKind] =
        useState<PropertyKind>('backing');
    // When true, picker adds an additional mapping instead of replacing primary ref
    const [addingAdditionalMapping, setAddingAdditionalMapping] = useState(false);

    // Link creation state
    const [newLinkTarget, setNewLinkTarget] = useState('');
    const [newLinkVerb, setNewLinkVerb] = useState('');
    const [newLinkCardinality, setNewLinkCardinality] =
        useState<ObjectLink['cardinality']>('one-to-many');

    const selectedObject = objects.find((o) => o.id === selectedObjectId);

    const handleAddObject = useCallback(() => {
        if (!newObjectName.trim()) return;
        const id = genId('obj');
        addObject({ id, name: newObjectName.trim(), properties: [] });
        setSelectedObjectId(id);
        setNewObjectName('');
    }, [newObjectName, addObject]);

    const handleAddFromPreset = useCallback(
        (preset: (typeof OBJECT_PRESETS)[number]) => {
            const id = genId('obj');
            const properties: ObjectProperty[] = preset.props.map((name) => ({
                id: genId('prop'),
                name,
                type: 'STRING' as FieldType,
                kind: 'backing' as PropertyKind,
                ref: '',
            }));
            addObject({ id, name: preset.name, properties });
            setSelectedObjectId(id);
        },
        [addObject],
    );

    const handleAddProperty = useCallback(() => {
        if (!selectedObjectId || !newPropName.trim()) return;
        addProperty(selectedObjectId, {
            id: genId('prop'),
            name: newPropName.trim(),
            type: newPropType,
            kind: newPropKind,
            ref: newPropRef.trim(),
        });
        setNewPropName('');
        setNewPropRef('');
    }, [
        selectedObjectId,
        newPropName,
        newPropType,
        newPropKind,
        newPropRef,
        addProperty,
    ]);

    const handlePickerSelect = useCallback(
        (ref: string, fieldType: FieldType) => {
            if (editingPropId && selectedObject) {
                if (addingAdditionalMapping) {
                    // Adding an additional source mapping
                    updateObject(selectedObject.id, {
                        properties: selectedObject.properties.map((p) => {
                            if (p.id !== editingPropId) return p;
                            const newMapping: SourceMapping = { ref };
                            const existing = p.additionalMappings ?? [];
                            return {
                                ...p,
                                additionalMappings: [...existing, newMapping],
                            };
                        }),
                    });
                } else {
                    // Updating an existing property's primary ref
                    updateObject(selectedObject.id, {
                        properties: selectedObject.properties.map((p) =>
                            p.id === editingPropId
                                ? { ...p, ref, type: fieldType }
                                : p,
                        ),
                    });
                }
                setEditingPropId(null);
                setAddingAdditionalMapping(false);
            } else {
                // Setting ref for new property form
                setNewPropRef(ref);
                setNewPropType(fieldType);
            }
        },
        [editingPropId, selectedObject, updateObject, addingAdditionalMapping],
    );

    const openPickerForExisting = useCallback(
        (prop: ObjectProperty) => {
            setEditingPropId(prop.id);
            setEditingPropKind(prop.kind);
            setAddingAdditionalMapping(false);
            setPickerOpen(true);
        },
        [],
    );

    const openPickerForAdditional = useCallback((prop: ObjectProperty) => {
        setEditingPropId(prop.id);
        setEditingPropKind('backing');
        setAddingAdditionalMapping(true);
        setPickerOpen(true);
    }, []);

    const removeAdditionalMapping = useCallback(
        (propId: string, mappingIdx: number) => {
            if (!selectedObject) return;
            updateObject(selectedObject.id, {
                properties: selectedObject.properties.map((p) => {
                    if (p.id !== propId || !p.additionalMappings) return p;
                    return {
                        ...p,
                        additionalMappings: p.additionalMappings.filter(
                            (_, i) => i !== mappingIdx,
                        ),
                    };
                }),
            });
        },
        [selectedObject, updateObject],
    );

    const updateMappingTransform = useCallback(
        (propId: string, mappingIdx: number, transform: string) => {
            if (!selectedObject) return;
            updateObject(selectedObject.id, {
                properties: selectedObject.properties.map((p) => {
                    if (p.id !== propId || !p.additionalMappings) return p;
                    return {
                        ...p,
                        additionalMappings: p.additionalMappings.map((m, i) =>
                            i === mappingIdx
                                ? {
                                      ...m,
                                      ...(transform
                                          ? { transform }
                                          : { transform: undefined }),
                                  }
                                : m,
                        ),
                    };
                }),
            });
        },
        [selectedObject, updateObject],
    );

    const handleAddLink = useCallback(() => {
        if (!selectedObjectId || !newLinkTarget || !newLinkVerb.trim()) return;
        addLink({
            id: genId('link'),
            sourceObjectId: selectedObjectId,
            targetObjectId: newLinkTarget,
            verb: newLinkVerb.trim().toUpperCase(),
            cardinality: newLinkCardinality,
        });
        setNewLinkVerb('');
    }, [
        selectedObjectId,
        newLinkTarget,
        newLinkVerb,
        newLinkCardinality,
        addLink,
    ]);

    const objectLinks = links.filter(
        (l) =>
            l.sourceObjectId === selectedObjectId ||
            l.targetObjectId === selectedObjectId,
    );

    return (
        <div className={styles.builderLayout}>
            {/* Left: Object list */}
            <div className={styles.leftPanel}>
                <Stack spacing={12}>
                    <Title order={5}>Objects</Title>
                    <Group spacing={8}>
                        <TextInput
                            placeholder="New object name..."
                            value={newObjectName}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>,
                            ) => setNewObjectName(e.currentTarget.value)}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') handleAddObject();
                            }}
                            size="sm"
                            style={{ flex: 1 }}
                        />
                        <Button
                            size="sm"
                            variant="light"
                            onClick={handleAddObject}
                            disabled={!newObjectName.trim()}
                        >
                            <IconPlus size={16} />
                        </Button>
                    </Group>

                    <ScrollArea h="calc(100vh - 220px)">
                        <Stack spacing={6}>
                            {objects.map((obj) => (
                                <div
                                    key={obj.id}
                                    className={`${styles.connectorCard} ${
                                        selectedObjectId === obj.id
                                            ? styles.connectorCardSelected
                                            : ''
                                    }`}
                                    onClick={() => setSelectedObjectId(obj.id)}
                                >
                                    <Group position="apart">
                                        <Text size="sm" weight={500}>
                                            {obj.name}
                                        </Text>
                                        <Group spacing={4}>
                                            <Badge
                                                size="xs"
                                                color="green"
                                                variant="light"
                                            >
                                                {obj.properties.length} props
                                            </Badge>
                                            <ActionIcon
                                                size="xs"
                                                color="red"
                                                variant="subtle"
                                                onClick={(
                                                    e: React.MouseEvent,
                                                ) => {
                                                    e.stopPropagation();
                                                    removeObject(obj.id);
                                                    if (
                                                        selectedObjectId ===
                                                        obj.id
                                                    ) {
                                                        setSelectedObjectId(
                                                            null,
                                                        );
                                                    }
                                                }}
                                            >
                                                <IconTrash size={12} />
                                            </ActionIcon>
                                        </Group>
                                    </Group>
                                </div>
                            ))}
                            {objects.length === 0 && (
                                <Text color="dimmed" size="sm" align="center">
                                    No objects yet. Create one above.
                                </Text>
                            )}
                        </Stack>
                    </ScrollArea>
                </Stack>
            </div>

            {/* Right: Properties + Links editor */}
            <div className={styles.mainPanel}>
                {selectedObject ? (
                    <Stack spacing={24}>
                        {/* Object header */}
                        <Group position="apart">
                            <Title order={5}>{selectedObject.name}</Title>
                            <TextInput
                                size="xs"
                                value={selectedObject.name}
                                onChange={(
                                    e: React.ChangeEvent<HTMLInputElement>,
                                ) =>
                                    updateObject(selectedObject.id, {
                                        name: e.currentTarget.value,
                                    })
                                }
                                style={{ width: 200 }}
                            />
                        </Group>

                        {/* Properties */}
                        <Stack spacing={8}>
                            <Title order={6}>Properties</Title>
                            {selectedObject.properties.map((prop) => (
                                <Stack key={prop.id} spacing={2}>
                                    <div className={styles.fieldRow}>
                                        <Text
                                            size="sm"
                                            weight={500}
                                            style={{ width: 140 }}
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
                                        <Badge
                                            size="xs"
                                            color={
                                                prop.kind === 'backing'
                                                    ? 'blue'
                                                    : prop.kind === 'derived'
                                                      ? 'teal'
                                                      : prop.kind === 'system'
                                                        ? 'gray'
                                                        : 'orange'
                                            }
                                            variant="light"
                                        >
                                            {prop.kind}
                                        </Badge>
                                        {prop.kind === 'system' ? (
                                            <Text
                                                size="xs"
                                                color="dimmed"
                                                style={{ flex: 1 }}
                                            >
                                                System field — present in all sources
                                            </Text>
                                        ) : prop.ref ? (
                                            <Text
                                                size="xs"
                                                color="blue"
                                                style={{
                                                    flex: 1,
                                                    cursor: 'pointer',
                                                }}
                                                onClick={() =>
                                                    openPickerForExisting(prop)
                                                }
                                            >
                                                {prop.ref}
                                            </Text>
                                        ) : (
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                color="gray"
                                                compact
                                                leftIcon={
                                                    <IconLink size={10} />
                                                }
                                                onClick={() =>
                                                    openPickerForExisting(prop)
                                                }
                                                style={{ flex: 1 }}
                                                styles={{
                                                    label: {
                                                        fontWeight: 400,
                                                        fontSize: 11,
                                                    },
                                                }}
                                            >
                                                Map to source...
                                            </Button>
                                        )}
                                        <ActionIcon
                                            size="xs"
                                            color="red"
                                            variant="subtle"
                                            onClick={() =>
                                                removeProperty(
                                                    selectedObject.id,
                                                    prop.id,
                                                )
                                            }
                                        >
                                            <IconTrash size={12} />
                                        </ActionIcon>
                                    </div>
                                    {/* Additional source mappings */}
                                    {prop.kind === 'backing' &&
                                        prop.additionalMappings?.map(
                                            (mapping, idx) => (
                                                <Group
                                                    key={`${prop.id}-m-${idx}`}
                                                    spacing={4}
                                                    pl={152}
                                                >
                                                    <Text
                                                        size="xs"
                                                        color="dimmed"
                                                    >
                                                        +
                                                    </Text>
                                                    <Text
                                                        size="xs"
                                                        color="blue"
                                                        style={{
                                                            cursor: 'pointer',
                                                        }}
                                                    >
                                                        {mapping.ref}
                                                    </Text>
                                                    {mapping.transform && (
                                                        <TextInput
                                                            size="xs"
                                                            value={
                                                                mapping.transform
                                                            }
                                                            onChange={(
                                                                e: React.ChangeEvent<HTMLInputElement>,
                                                            ) =>
                                                                updateMappingTransform(
                                                                    prop.id,
                                                                    idx,
                                                                    e
                                                                        .currentTarget
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="transform"
                                                            style={{
                                                                width: 180,
                                                            }}
                                                        />
                                                    )}
                                                    {!mapping.transform && (
                                                        <Button
                                                            size="xs"
                                                            variant="subtle"
                                                            compact
                                                            color="gray"
                                                            onClick={() =>
                                                                updateMappingTransform(
                                                                    prop.id,
                                                                    idx,
                                                                    '{value}',
                                                                )
                                                            }
                                                        >
                                                            + transform
                                                        </Button>
                                                    )}
                                                    <ActionIcon
                                                        size="xs"
                                                        color="red"
                                                        variant="subtle"
                                                        onClick={() =>
                                                            removeAdditionalMapping(
                                                                prop.id,
                                                                idx,
                                                            )
                                                        }
                                                    >
                                                        <IconTrash size={10} />
                                                    </ActionIcon>
                                                </Group>
                                            ),
                                        )}
                                    {prop.kind === 'backing' && prop.ref && (
                                        <Group spacing={4} pl={152}>
                                            <Button
                                                size="xs"
                                                variant="subtle"
                                                compact
                                                color="gray"
                                                leftIcon={
                                                    <IconPlus size={10} />
                                                }
                                                onClick={() =>
                                                    openPickerForAdditional(
                                                        prop,
                                                    )
                                                }
                                                styles={{
                                                    label: {
                                                        fontWeight: 400,
                                                        fontSize: 10,
                                                    },
                                                }}
                                            >
                                                Add source
                                            </Button>
                                        </Group>
                                    )}
                                </Stack>
                            ))}

                            {/* Add property form */}
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
                                <NativeSelect
                                    size="xs"
                                    value={newPropKind}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLSelectElement>,
                                    ) =>
                                        setNewPropKind(
                                            e.currentTarget
                                                .value as PropertyKind,
                                        )
                                    }
                                    data={PROPERTY_KINDS}
                                    style={{ width: 110 }}
                                />
                                {newPropKind === 'computed' ? (
                                    <TextInput
                                        placeholder="SQL formula"
                                        size="xs"
                                        value={newPropRef}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) =>
                                            setNewPropRef(
                                                e.currentTarget.value,
                                            )
                                        }
                                        style={{ flex: 1 }}
                                    />
                                ) : newPropKind === 'system' ? (
                                    <Text
                                        size="xs"
                                        color="dimmed"
                                        style={{ flex: 1 }}
                                    >
                                        Auto-injected by envelope
                                    </Text>
                                ) : (
                                    <Button
                                        size="xs"
                                        variant="outline"
                                        leftIcon={<IconLink size={12} />}
                                        onClick={() => setPickerOpen(true)}
                                        style={{
                                            flex: 1,
                                            justifyContent: 'flex-start',
                                        }}
                                        styles={{
                                            label: { fontWeight: 400 },
                                        }}
                                    >
                                        {newPropRef || 'Pick source field...'}
                                    </Button>
                                )}
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

                        {/* Links */}
                        <Stack spacing={8}>
                            <Title order={6}>Links</Title>
                            {objectLinks.map((link) => {
                                const target = objects.find(
                                    (o) =>
                                        o.id ===
                                        (link.sourceObjectId ===
                                        selectedObjectId
                                            ? link.targetObjectId
                                            : link.sourceObjectId),
                                );
                                return (
                                    <Group key={link.id} spacing={8}>
                                        <Text size="sm">
                                            {selectedObject.name}
                                        </Text>
                                        <Badge
                                            size="xs"
                                            color="violet"
                                            variant="light"
                                        >
                                            {link.verb}
                                        </Badge>
                                        <Text size="sm">
                                            {target?.name ?? '?'}
                                        </Text>
                                        <Badge
                                            size="xs"
                                            color="gray"
                                            variant="outline"
                                        >
                                            {link.cardinality}
                                        </Badge>
                                        <ActionIcon
                                            size="xs"
                                            color="red"
                                            variant="subtle"
                                            onClick={() => removeLink(link.id)}
                                        >
                                            <IconTrash size={12} />
                                        </ActionIcon>
                                    </Group>
                                );
                            })}

                            {objects.length > 1 && (
                                <Group spacing={8} mt={8}>
                                    <TextInput
                                        placeholder="Verb (e.g. OWNS)"
                                        size="xs"
                                        value={newLinkVerb}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLInputElement>,
                                        ) =>
                                            setNewLinkVerb(
                                                e.currentTarget.value,
                                            )
                                        }
                                        style={{ width: 120 }}
                                    />
                                    <NativeSelect
                                        size="xs"
                                        value={newLinkTarget}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLSelectElement>,
                                        ) =>
                                            setNewLinkTarget(
                                                e.currentTarget.value,
                                            )
                                        }
                                        data={[
                                            { value: '', label: 'Target...' },
                                            ...objects
                                                .filter(
                                                    (o) =>
                                                        o.id !==
                                                        selectedObjectId,
                                                )
                                                .map((o) => ({
                                                    value: o.id,
                                                    label: o.name,
                                                })),
                                        ]}
                                        style={{ width: 140 }}
                                    />
                                    <NativeSelect
                                        size="xs"
                                        value={newLinkCardinality}
                                        onChange={(
                                            e: React.ChangeEvent<HTMLSelectElement>,
                                        ) =>
                                            setNewLinkCardinality(
                                                e.currentTarget
                                                    .value as ObjectLink['cardinality'],
                                            )
                                        }
                                        data={[...CARDINALITIES]}
                                        style={{ width: 130 }}
                                    />
                                    <Button
                                        size="xs"
                                        variant="light"
                                        onClick={handleAddLink}
                                        disabled={
                                            !newLinkVerb.trim() ||
                                            !newLinkTarget
                                        }
                                    >
                                        Add Link
                                    </Button>
                                </Group>
                            )}
                        </Stack>
                    </Stack>
                ) : objects.length === 0 ? (
                    <Stack spacing={24} p="md">
                        <div>
                            <Title order={5}>Define your business objects</Title>
                            <Text size="sm" color="dimmed" mt={4}>
                                Start with a suggested preset or create a custom
                                object using the panel on the left.
                            </Text>
                        </div>
                        <SimpleGrid cols={2} spacing="md">
                            {OBJECT_PRESETS.map((preset) => (
                                <Card
                                    key={preset.name}
                                    shadow="xs"
                                    padding="md"
                                    radius="md"
                                    withBorder
                                    sx={{
                                        cursor: 'pointer',
                                        '&:hover': {
                                            borderColor: 'var(--mantine-color-blue-4)',
                                            backgroundColor:
                                                'var(--mantine-color-blue-0)',
                                        },
                                    }}
                                    onClick={() => handleAddFromPreset(preset)}
                                >
                                    <Text size="sm" weight={600}>
                                        {preset.name}
                                    </Text>
                                    <Text size="xs" color="dimmed" mt={2}>
                                        {preset.description}
                                    </Text>
                                    <Group spacing={4} mt={8}>
                                        {preset.props.map((p) => (
                                            <Badge
                                                key={p}
                                                size="xs"
                                                variant="outline"
                                                color="gray"
                                            >
                                                {p}
                                            </Badge>
                                        ))}
                                    </Group>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Stack>
                ) : (
                    <Stack
                        align="center"
                        sx={{ justifyContent: 'center', height: '100%' }}
                    >
                        <Text color="dimmed" size="lg">
                            Select an object to edit its properties
                        </Text>
                    </Stack>
                )}
            </div>

            <FieldRefPicker
                opened={pickerOpen}
                onClose={() => {
                    setPickerOpen(false);
                    setEditingPropId(null);
                    setAddingAdditionalMapping(false);
                }}
                onSelect={handlePickerSelect}
                kind={editingPropId ? editingPropKind : newPropKind}
                events={events}
            />
        </div>
    );
};

export default OntologyBuilder;
