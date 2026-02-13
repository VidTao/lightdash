import {
    ActionIcon,
    Badge,
    Button,
    Group,
    NativeSelect,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './WorkshopBuilder.module.css';
import type {
    FieldType,
    ObjectLink,
    ObjectProperty,
    OntologyObject,
    PropertyKind,
} from './types';

type Props = {
    objects: OntologyObject[];
    links: ObjectLink[];
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
const PROPERTY_KINDS: PropertyKind[] = ['backing', 'derived', 'computed'];
const CARDINALITIES = ['one-to-one', 'one-to-many', 'many-to-many'] as const;

let nextId = 1;
const genId = (prefix: string) => `${prefix}-${nextId++}`;

const OntologyBuilder: FC<Props> = ({
    objects,
    links,
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
                                    <Badge
                                        size="xs"
                                        color={
                                            prop.kind === 'backing'
                                                ? 'blue'
                                                : prop.kind === 'derived'
                                                  ? 'teal'
                                                  : 'orange'
                                        }
                                        variant="light"
                                    >
                                        {prop.kind}
                                    </Badge>
                                    {prop.ref && (
                                        <Text size="xs" color="dimmed">
                                            {prop.ref}
                                        </Text>
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
                                <TextInput
                                    placeholder="$ref or formula"
                                    size="xs"
                                    value={newPropRef}
                                    onChange={(
                                        e: React.ChangeEvent<HTMLInputElement>,
                                    ) => setNewPropRef(e.currentTarget.value)}
                                    style={{ flex: 1 }}
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
                ) : (
                    <Stack
                        align="center"
                        sx={{ justifyContent: 'center', height: '100%' }}
                    >
                        <Text color="dimmed" size="lg">
                            Select or create an object to edit its properties
                        </Text>
                    </Stack>
                )}
            </div>
        </div>
    );
};

export default OntologyBuilder;
