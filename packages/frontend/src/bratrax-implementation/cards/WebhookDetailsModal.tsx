import {
    Badge,
    Box,
    Group,
    Loader,
    Modal,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';

const BRATRAX_API_BASE = '/api/v1/bratrax';

interface WebhookDetailsModalProps {
    opened: boolean;
    onClose: () => void;
    source: string;
    platformName: string;
}

type StreamSummary = {
    name: string;
    field_count: number;
    key_properties: string[];
    replication_method: string | null;
};

type StreamFieldsResponse = {
    tap: string;
    stream: string;
    source_name: string;
    key_properties: string[];
    replication_method: string | null;
    fields: { name: string; type: string; nullable: boolean }[];
};

const StreamFieldsTable = ({
    source,
    streamName,
}: {
    source: string;
    streamName: string;
}) => {
    const { data, isLoading } = useQuery({
        queryKey: ['webhook-stream-fields', source, streamName],
        queryFn: async (): Promise<StreamFieldsResponse | null> => {
            try {
                const resp = await fetch(
                    `${BRATRAX_API_BASE}/catalogs/webhook-${source}/streams/${streamName}`,
                );
                if (!resp.ok) return null;
                const json = await resp.json();
                return json.results ?? json;
            } catch {
                return null;
            }
        },
        staleTime: 30_000,
    });

    if (isLoading) return <Loader size="sm" />;
    if (!data) return <Text color="dimmed">Failed to load fields</Text>;

    return (
        <Table striped highlightOnHover withBorder withColumnBorders mt="xs">
            <thead>
                <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Key</th>
                </tr>
            </thead>
            <tbody>
                {data.fields.map((f) => (
                    <tr key={f.name}>
                        <td>
                            <Text size="sm" ff="monospace">
                                {f.name}
                            </Text>
                        </td>
                        <td>
                            <Badge size="sm" variant="light">
                                {f.type}
                            </Badge>
                        </td>
                        <td>
                            {data.key_properties.includes(f.name) && (
                                <IconCheck size={14} color="green" />
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
};

const WebhookDetailsModal = ({
    opened,
    onClose,
    source,
    platformName,
}: WebhookDetailsModalProps) => {
    const { data: tapData, isLoading } = useQuery({
        queryKey: ['webhook-tap-streams', source],
        queryFn: async () => {
            try {
                const resp = await fetch(
                    `${BRATRAX_API_BASE}/catalogs/webhook-${source}/streams`,
                );
                if (!resp.ok) return null;
                const json = await resp.json();
                return json.results ?? json;
            } catch {
                return null;
            }
        },
        enabled: opened,
        staleTime: 30_000,
    });

    const streams: StreamSummary[] = tapData?.streams ?? [];

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group spacing="xs">
                    <Title order={4}>{platformName} Webhook Schema</Title>
                    <Badge color="green" variant="light" size="sm">
                        Discovered
                    </Badge>
                </Group>
            }
            size="lg"
        >
            {isLoading ? (
                <Box py="xl" sx={{ textAlign: 'center' }}>
                    <Loader />
                </Box>
            ) : streams.length === 0 ? (
                <Text color="dimmed">No streams found.</Text>
            ) : (
                streams.map((s) => (
                    <Box key={s.name} mb="lg">
                        <Group spacing="xs" mb="xs">
                            <Text weight={600} size="sm">
                                {s.name}
                            </Text>
                            <Badge size="xs" color="gray">
                                {s.field_count} fields
                            </Badge>
                        </Group>
                        <StreamFieldsTable
                            source={source}
                            streamName={s.name}
                        />
                    </Box>
                ))
            )}
        </Modal>
    );
};

export default WebhookDetailsModal;
