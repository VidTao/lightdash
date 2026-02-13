import {
    Badge,
    Checkbox,
    Group,
    Loader,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useMemo, useState, type FC } from 'react';
import {
    catalogEntriesToSourceConnectors,
    useBratraxCatalogs,
} from '../../hooks/useBratraxCatalogs';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './WorkshopBuilder.module.css';
import type { SourceConnector } from './types';

type Props = {
    sources: SourceConnector[];
    setSources: (sources: SourceConnector[]) => void;
    toggleStream: (tap: string, stream: string) => void;
    toggleField: (tap: string, stream: string, field: string) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
    ads: 'Advertising',
    commerce: 'Commerce',
    crm: 'CRM',
    analytics: 'Analytics',
    database: 'Database',
    other: 'Other',
};

const SourcesBuilder: FC<Props> = ({
    sources,
    setSources,
    toggleStream,
    toggleField,
}) => {
    const [search, setSearch] = useState('');
    const [selectedTap, setSelectedTap] = useState<string | null>(null);
    const { data: catalogsData, isLoading: catalogLoading } =
        useBratraxCatalogs();

    // Initialize sources from real catalog data on first render
    useEffect(() => {
        if (sources.length === 0 && catalogsData?.catalogs) {
            setSources(catalogEntriesToSourceConnectors(catalogsData.catalogs));
        }
    }, [sources.length, setSources, catalogsData]);

    const filteredSources = useMemo(() => {
        if (!search) return sources;
        const lower = search.toLowerCase();
        return sources.filter(
            (s) =>
                s.label.toLowerCase().includes(lower) ||
                s.tap.toLowerCase().includes(lower),
        );
    }, [sources, search]);

    const groupedSources = useMemo(() => {
        const groups: Record<string, SourceConnector[]> = {};
        for (const src of filteredSources) {
            const cat = src.category;
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(src);
        }
        return groups;
    }, [filteredSources]);

    const selectedSource = sources.find((s) => s.tap === selectedTap);

    if (catalogLoading && sources.length === 0) {
        return (
            <Group position="center" py="xl">
                <Loader size="sm" />
                <Text size="sm" color="dimmed">
                    Loading catalog data...
                </Text>
            </Group>
        );
    }

    return (
        <div className={styles.builderLayout}>
            {/* Left: Connector catalog */}
            <div className={styles.leftPanel}>
                <Stack spacing={12}>
                    <Title order={5}>Connectors</Title>
                    <TextInput
                        placeholder="Search connectors..."
                        icon={<IconSearch size={14} />}
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setSearch(e.currentTarget.value)
                        }
                        size="sm"
                    />
                    <ScrollArea h="calc(100vh - 200px)">
                        <Stack spacing={16}>
                            {Object.entries(groupedSources).map(
                                ([category, connectors]) => (
                                    <Stack key={category} spacing={6}>
                                        <Text
                                            size="xs"
                                            weight={600}
                                            color="dimmed"
                                            transform="uppercase"
                                        >
                                            {CATEGORY_LABELS[category] ??
                                                category}
                                        </Text>
                                        {connectors.map((connector) => {
                                            const selectedStreams =
                                                connector.streams.filter(
                                                    (s) => s.selected,
                                                ).length;
                                            return (
                                                <div
                                                    key={connector.tap}
                                                    className={`${styles.connectorCard} ${
                                                        selectedTap ===
                                                        connector.tap
                                                            ? styles.connectorCardSelected
                                                            : ''
                                                    } ${
                                                        !connector.available
                                                            ? styles.connectorCardUnavailable
                                                            : ''
                                                    }`}
                                                    onClick={() => {
                                                        if (
                                                            connector.available
                                                        ) {
                                                            setSelectedTap(
                                                                connector.tap,
                                                            );
                                                        }
                                                    }}
                                                >
                                                    <Group position="apart">
                                                        <Text
                                                            size="sm"
                                                            weight={500}
                                                        >
                                                            {connector.label}
                                                        </Text>
                                                        {!connector.available && (
                                                            <Badge
                                                                size="xs"
                                                                color="gray"
                                                                variant="light"
                                                            >
                                                                Coming soon
                                                            </Badge>
                                                        )}
                                                        {selectedStreams >
                                                            0 && (
                                                            <Badge
                                                                size="xs"
                                                                color="teal"
                                                                variant="filled"
                                                            >
                                                                {
                                                                    selectedStreams
                                                                }
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                </div>
                                            );
                                        })}
                                    </Stack>
                                ),
                            )}
                        </Stack>
                    </ScrollArea>
                </Stack>
            </div>

            {/* Right: Stream + field details */}
            <div className={styles.mainPanel}>
                {selectedSource ? (
                    <Stack spacing={16}>
                        <Title order={5}>
                            {selectedSource.label} — Streams
                        </Title>
                        <ScrollArea h="calc(100vh - 200px)">
                            <Stack spacing={16}>
                                {selectedSource.streams.map((stream) => (
                                    <div
                                        key={stream.name}
                                        className={`${styles.streamItem} ${
                                            stream.selected
                                                ? styles.streamItemSelected
                                                : ''
                                        }`}
                                    >
                                        <Stack spacing={8}>
                                            <Group>
                                                <Checkbox
                                                    checked={stream.selected}
                                                    onChange={() =>
                                                        toggleStream(
                                                            selectedSource.tap,
                                                            stream.name,
                                                        )
                                                    }
                                                    label={
                                                        <Text
                                                            size="sm"
                                                            weight={600}
                                                        >
                                                            {stream.name}
                                                        </Text>
                                                    }
                                                />
                                                <Badge
                                                    size="xs"
                                                    color="gray"
                                                    variant="light"
                                                >
                                                    {stream.fields.length}{' '}
                                                    fields
                                                </Badge>
                                            </Group>
                                            {stream.selected && (
                                                <Stack spacing={2} pl={28}>
                                                    {stream.fields.map(
                                                        (field) => (
                                                            <div
                                                                key={field.name}
                                                                className={
                                                                    styles.fieldRow
                                                                }
                                                            >
                                                                <Checkbox
                                                                    size="xs"
                                                                    checked={
                                                                        field.selected
                                                                    }
                                                                    onChange={() =>
                                                                        toggleField(
                                                                            selectedSource.tap,
                                                                            stream.name,
                                                                            field.name,
                                                                        )
                                                                    }
                                                                />
                                                                <Text
                                                                    size="xs"
                                                                    weight={500}
                                                                >
                                                                    {field.name}
                                                                </Text>
                                                                <Badge
                                                                    size="xs"
                                                                    color="gray"
                                                                    variant="outline"
                                                                >
                                                                    {field.type}
                                                                </Badge>
                                                            </div>
                                                        ),
                                                    )}
                                                </Stack>
                                            )}
                                        </Stack>
                                    </div>
                                ))}
                            </Stack>
                        </ScrollArea>
                    </Stack>
                ) : (
                    <Stack
                        align="center"
                        sx={{ justifyContent: 'center', height: '100%' }}
                    >
                        <Text color="dimmed" size="lg">
                            Select a connector to view its streams
                        </Text>
                    </Stack>
                )}
            </div>
        </div>
    );
};

export default SourcesBuilder;
