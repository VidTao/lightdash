import {
    Badge,
    Divider,
    Group,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { type FC } from 'react';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './Observatory.module.css';
import {
    NODE_KIND_COLORS,
    NODE_KIND_LABELS,
    type OntologyGraphData,
} from './types';

type Props = {
    nodeId: string;
    graphData: OntologyGraphData;
};

const ObservatoryPanel: FC<Props> = ({ nodeId, graphData }) => {
    const node = graphData.nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const colors = NODE_KIND_COLORS[node.kind];

    // Find upstream and downstream connections
    const upstream = graphData.edges
        .filter((e) => e.target === nodeId)
        .map((e) => graphData.nodes.find((n) => n.id === e.source))
        .filter(Boolean);

    const downstream = graphData.edges
        .filter((e) => e.source === nodeId)
        .map((e) => graphData.nodes.find((n) => n.id === e.target))
        .filter(Boolean);

    const renderDetails = () => {
        const { details } = node;
        const entries = Object.entries(details);
        if (entries.length === 0) return null;

        return entries.map(([key, value]) => {
            if (Array.isArray(value)) {
                return (
                    <Stack key={key} spacing={4}>
                        <Text
                            size="xs"
                            weight={600}
                            color="dimmed"
                            transform="uppercase"
                        >
                            {key}
                        </Text>
                        <Group spacing={4}>
                            {value.map((item) => (
                                <Badge
                                    key={String(item)}
                                    size="sm"
                                    variant="light"
                                    color="gray"
                                >
                                    {String(item)}
                                </Badge>
                            ))}
                        </Group>
                    </Stack>
                );
            }

            if (typeof value === 'object' && value !== null) {
                const objEntries = Object.entries(
                    value as Record<string, unknown>,
                );
                return (
                    <Stack key={key} spacing={4}>
                        <Text
                            size="xs"
                            weight={600}
                            color="dimmed"
                            transform="uppercase"
                        >
                            {key}
                        </Text>
                        <Table
                            withBorder
                            withColumnBorders
                            horizontalSpacing="xs"
                            verticalSpacing={4}
                        >
                            <tbody>
                                {objEntries.map(([k, v]) => (
                                    <tr key={k}>
                                        <td>
                                            <Text size="xs" weight={500}>
                                                {k}
                                            </Text>
                                        </td>
                                        <td>
                                            <Text size="xs" color="dimmed">
                                                {String(v)}
                                            </Text>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Stack>
                );
            }

            return (
                <Group key={key} position="apart">
                    <Text
                        size="xs"
                        weight={600}
                        color="dimmed"
                        transform="uppercase"
                    >
                        {key}
                    </Text>
                    <Text size="sm">{String(value)}</Text>
                </Group>
            );
        });
    };

    const renderLineage = (label: string, items: typeof upstream) => {
        if (items.length === 0) return null;

        return (
            <Stack spacing={4}>
                <Text
                    size="xs"
                    weight={600}
                    color="dimmed"
                    transform="uppercase"
                >
                    {label}
                </Text>
                {items.map((item) => {
                    if (!item) return null;
                    const itemColors = NODE_KIND_COLORS[item.kind];
                    return (
                        <Group key={item.id} spacing={8}>
                            <span
                                className={styles.legendDot}
                                style={{
                                    backgroundColor: itemColors.bg,
                                    borderColor: itemColors.border,
                                }}
                            />
                            <Text size="sm">{item.label}</Text>
                            <Badge size="xs" variant="light" color="gray">
                                {NODE_KIND_LABELS[item.kind]}
                            </Badge>
                        </Group>
                    );
                })}
            </Stack>
        );
    };

    return (
        <div className={styles.panel}>
            <Stack spacing={16}>
                <div>
                    <Badge
                        size="sm"
                        variant="light"
                        style={{
                            backgroundColor: colors.bg,
                            color: colors.text,
                            borderColor: colors.border,
                        }}
                        mb={8}
                    >
                        {NODE_KIND_LABELS[node.kind]}
                    </Badge>
                    <Title order={4}>{node.label}</Title>
                </div>

                <Divider />

                {renderDetails()}

                {(upstream.length > 0 || downstream.length > 0) && (
                    <>
                        <Divider />
                        <Title order={6}>Lineage</Title>
                        {renderLineage('Upstream', upstream)}
                        {renderLineage('Downstream', downstream)}
                    </>
                )}
            </Stack>
        </div>
    );
};

export default ObservatoryPanel;
