/**
 * Collapsible panel showing drift check results per stream.
 * Accordion layout with severity icons, exclusion cards, and coverage bars.
 */
import {
    Accordion,
    Badge,
    Button,
    Group,
    Loader,
    Progress,
    ScrollArea,
    Stack,
    Text,
    ThemeIcon,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconAlertTriangle,
    IconCheck,
    IconInfoCircle,
    IconX,
} from '@tabler/icons-react';
import type { FC } from 'react';
import type {
    DriftCheckResult,
    DriftItem,
    DriftStreamResult,
    ExclusionViolationItem,
} from '../../hooks/useBratraxDrift';

type Props = {
    result: DriftCheckResult | null;
    isLoading: boolean;
    onClose: () => void;
};

const SEVERITY_ICON: Record<string, FC<{ size: number }>> = {
    error: ({ size }) => (
        <ThemeIcon size={size} color="red" variant="light" radius="xl">
            <IconAlertCircle size={size - 4} />
        </ThemeIcon>
    ),
    warning: ({ size }) => (
        <ThemeIcon size={size} color="yellow" variant="light" radius="xl">
            <IconAlertTriangle size={size - 4} />
        </ThemeIcon>
    ),
    info: ({ size }) => (
        <ThemeIcon size={size} color="blue" variant="light" radius="xl">
            <IconInfoCircle size={size - 4} />
        </ThemeIcon>
    ),
};

const DriftItemRow: FC<{ item: DriftItem }> = ({ item }) => {
    const Icon = SEVERITY_ICON[item.severity] ?? SEVERITY_ICON.info;
    return (
        <Group spacing={8} noWrap>
            <Icon size={22} />
            <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="xs" weight={500}>
                    {item.field}
                </Text>
                <Text size="xs" color="dimmed">
                    {item.message}
                </Text>
            </div>
            <Badge size="xs" variant="outline">
                {item.kind}
            </Badge>
        </Group>
    );
};

const ExclusionCard: FC<{ violation: ExclusionViolationItem }> = ({
    violation,
}) => (
    <div
        style={{
            padding: 8,
            border: '1px solid var(--mantine-color-red-3)',
            borderRadius: 6,
            backgroundColor: 'var(--mantine-color-red-0)',
        }}
    >
        <Group spacing={6}>
            <IconAlertCircle size={14} color="var(--mantine-color-red-6)" />
            <Text size="xs" weight={600} color="red">
                Exclusion Conflict
            </Text>
        </Group>
        <Text size="xs" mt={4}>
            {violation.message}
        </Text>
    </div>
);

const StreamSection: FC<{ stream: DriftStreamResult }> = ({ stream }) => {
    const errorCount = stream.drifts.filter(
        (d) => d.severity === 'error',
    ).length;
    const warningCount = stream.drifts.filter(
        (d) => d.severity === 'warning',
    ).length;
    const coverageColor =
        stream.coverage_pct >= 80
            ? 'teal'
            : stream.coverage_pct >= 50
              ? 'yellow'
              : 'red';

    return (
        <Accordion.Item value={`${stream.source}.${stream.stream}`}>
            <Accordion.Control>
                <Group position="apart">
                    <Group spacing={8}>
                        <Text size="sm" weight={600}>
                            {stream.source}.{stream.stream}
                        </Text>
                        {errorCount > 0 && (
                            <Badge size="xs" color="red" variant="filled">
                                {errorCount} error{errorCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {warningCount > 0 && (
                            <Badge size="xs" color="yellow" variant="filled">
                                {warningCount} warning
                                {warningCount > 1 ? 's' : ''}
                            </Badge>
                        )}
                        {stream.exclusion_violations.length > 0 && (
                            <Badge size="xs" color="red" variant="light">
                                {stream.exclusion_violations.length} exclusion
                                {stream.exclusion_violations.length > 1
                                    ? 's'
                                    : ''}
                            </Badge>
                        )}
                    </Group>
                    <Text size="xs" color="dimmed">
                        {stream.coverage_pct}% coverage
                    </Text>
                </Group>
            </Accordion.Control>
            <Accordion.Panel>
                <Stack spacing={8}>
                    <div>
                        <Group position="apart" mb={4}>
                            <Text size="xs" color="dimmed">
                                Field coverage: {stream.declared_fields}/
                                {stream.catalog_fields}
                            </Text>
                            <Text size="xs" weight={500} color={coverageColor}>
                                {stream.coverage_pct}%
                            </Text>
                        </Group>
                        <Progress
                            value={stream.coverage_pct}
                            color={coverageColor}
                            size="sm"
                        />
                    </div>

                    {stream.drifts.map((drift, i) => (
                        <DriftItemRow key={`${drift.field}-${i}`} item={drift} />
                    ))}

                    {stream.exclusion_violations.map((v, i) => (
                        <ExclusionCard key={`excl-${i}`} violation={v} />
                    ))}

                    {stream.drifts.length === 0 &&
                        stream.exclusion_violations.length === 0 && (
                            <Group spacing={6}>
                                <IconCheck
                                    size={14}
                                    color="var(--mantine-color-teal-6)"
                                />
                                <Text size="xs" color="teal">
                                    No drift issues found
                                </Text>
                            </Group>
                        )}
                </Stack>
            </Accordion.Panel>
        </Accordion.Item>
    );
};

const DriftPanel: FC<Props> = ({ result, isLoading, onClose }) => {
    if (isLoading) {
        return (
            <Stack align="center" justify="center" h="100%" spacing="sm">
                <Loader size="sm" />
                <Text size="sm" color="dimmed">
                    Running drift analysis...
                </Text>
            </Stack>
        );
    }

    if (!result) {
        return (
            <Stack align="center" justify="center" h="100%">
                <Text size="sm" color="dimmed">
                    Click "Drift Check" to analyze schema drift.
                </Text>
            </Stack>
        );
    }

    return (
        <Stack spacing={0} h="100%">
            <Group position="apart" px="md" py={8}>
                <Group spacing={8}>
                    <Text size="sm" weight={600}>
                        Drift Analysis
                    </Text>
                    {result.has_errors ? (
                        <Badge size="xs" color="red" variant="filled">
                            Has Errors
                        </Badge>
                    ) : (
                        <Badge size="xs" color="teal" variant="filled">
                            Clean
                        </Badge>
                    )}
                </Group>
                <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={onClose}
                    leftIcon={<IconX size={14} />}
                >
                    Close
                </Button>
            </Group>

            <ScrollArea style={{ flex: 1 }} px="md">
                {result.results.length === 0 ? (
                    <Stack align="center" py="xl">
                        <IconCheck
                            size={32}
                            color="var(--mantine-color-teal-6)"
                        />
                        <Text size="sm" color="teal">
                            No drift detected across all streams.
                        </Text>
                    </Stack>
                ) : (
                    <Accordion variant="separated" radius="sm">
                        {result.results.map((stream) => (
                            <StreamSection
                                key={`${stream.source}.${stream.stream}`}
                                stream={stream}
                            />
                        ))}
                    </Accordion>
                )}
            </ScrollArea>
        </Stack>
    );
};

export default DriftPanel;
