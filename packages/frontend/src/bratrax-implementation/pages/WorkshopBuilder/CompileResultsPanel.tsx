import {
    ActionIcon,
    Badge,
    Box,
    Code,
    Collapse,
    Group,
    Loader,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    IconChevronDown,
    IconChevronRight,
    IconFileCode,
    IconX,
} from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
import type { CompileArtifact, CompileResult } from '../../hooks/useBratraxApi';

type Props = {
    result: CompileResult | null;
    isCompiling: boolean;
    onClose: () => void;
};

const LAYER_COLORS: Record<string, string> = {
    flatten: 'yellow',
    activity_stream: 'teal',
    dim: 'green',
    meltano: 'violet',
};

const LAYER_LABELS: Record<string, string> = {
    flatten: 'Flatten Models',
    activity_stream: 'Activity Stream',
    dim: 'Dimension Tables',
    meltano: 'Meltano Config',
};

type ArtifactItemProps = {
    artifact: CompileArtifact;
};

const ArtifactItem: FC<ArtifactItemProps> = ({ artifact }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Box>
            <Group
                spacing={6}
                style={{ cursor: 'pointer' }}
                onClick={() => setExpanded((v) => !v)}
            >
                {expanded ? (
                    <IconChevronDown size={12} />
                ) : (
                    <IconChevronRight size={12} />
                )}
                <IconFileCode size={14} />
                <Text size="xs" style={{ fontFamily: 'monospace' }}>
                    {artifact.path}
                </Text>
            </Group>
            <Collapse in={expanded}>
                <Code
                    block
                    style={{
                        fontSize: 11,
                        maxHeight: 200,
                        overflow: 'auto',
                        marginTop: 4,
                        marginLeft: 20,
                    }}
                >
                    {artifact.content}
                </Code>
            </Collapse>
        </Box>
    );
};

const CompileResultsPanel: FC<Props> = ({ result, isCompiling, onClose }) => {
    const groupByLayer = useCallback(
        (artifacts: CompileArtifact[]) => {
            const groups: Record<string, CompileArtifact[]> = {};
            for (const a of artifacts) {
                const layer = a.layer;
                if (!groups[layer]) groups[layer] = [];
                groups[layer].push(a);
            }
            return groups;
        },
        [],
    );

    if (isCompiling) {
        return (
            <Box p="md">
                <Group spacing={8}>
                    <Loader size="xs" />
                    <Text size="sm">Compiling...</Text>
                </Group>
            </Box>
        );
    }

    if (!result) return null;

    if (!result.success) {
        return (
            <Box p="md">
                <Group position="apart" mb="sm">
                    <Title order={6} color="red">
                        Compilation Failed
                    </Title>
                    <ActionIcon size="xs" onClick={onClose}>
                        <IconX size={14} />
                    </ActionIcon>
                </Group>
                <Stack spacing={4}>
                    {result.errors?.map((err, i) => (
                        <Text key={i} size="xs" color="red">
                            [{err.code}] {err.message}
                        </Text>
                    ))}
                </Stack>
            </Box>
        );
    }

    const grouped = groupByLayer(result.artifacts);

    return (
        <Box p="md" style={{ overflow: 'auto', maxHeight: '100%' }}>
            <Group position="apart" mb="sm">
                <Group spacing={8}>
                    <Title order={6}>Compiled Artifacts</Title>
                    <Badge size="sm" variant="light">
                        {result.summary?.total ?? result.artifacts.length} files
                    </Badge>
                </Group>
                <ActionIcon size="xs" onClick={onClose}>
                    <IconX size={14} />
                </ActionIcon>
            </Group>

            <Stack spacing="md">
                {Object.entries(grouped).map(([layer, artifacts]) => (
                    <Box key={layer}>
                        <Group spacing={6} mb={4}>
                            <Badge
                                size="xs"
                                color={LAYER_COLORS[layer] ?? 'gray'}
                                variant="light"
                            >
                                {LAYER_LABELS[layer] ?? layer}
                            </Badge>
                            <Text size="xs" color="dimmed">
                                ({artifacts.length})
                            </Text>
                        </Group>
                        <Stack spacing={2} ml={8}>
                            {artifacts.map((a) => (
                                <ArtifactItem key={a.path} artifact={a} />
                            ))}
                        </Stack>
                    </Box>
                ))}
            </Stack>
        </Box>
    );
};

export default CompileResultsPanel;
