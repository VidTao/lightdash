import { Badge, Group, Text } from '@mantine/core';
import {
    IconAlertTriangle,
    IconCircleCheck,
    IconInfoCircle,
    IconX,
} from '@tabler/icons-react';
import { useMemo, type FC } from 'react';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './WorkshopBuilder.module.css';
import type {
    BuilderTab,
    ValidationMessage,
    ValidationSeverity,
} from './types';

type Props = {
    messages: ValidationMessage[];
    activeTab: BuilderTab;
};

const SEVERITY_CONFIG: Record<
    ValidationSeverity,
    { color: string; icon: typeof IconX }
> = {
    error: { color: 'red', icon: IconX },
    warning: { color: 'yellow', icon: IconAlertTriangle },
    info: { color: 'blue', icon: IconInfoCircle },
};

const ValidationBar: FC<Props> = ({ messages, activeTab }) => {
    const tabMessages = useMemo(
        () => messages.filter((m) => m.tab === activeTab),
        [messages, activeTab],
    );

    const errorCount = tabMessages.filter((m) => m.severity === 'error').length;
    const warningCount = tabMessages.filter(
        (m) => m.severity === 'warning',
    ).length;

    if (tabMessages.length === 0) {
        return (
            <div className={styles.validationBar}>
                <IconCircleCheck
                    size={16}
                    color="var(--mantine-color-green-6)"
                />
                <Text size="xs" color="dimmed">
                    No issues
                </Text>
            </div>
        );
    }

    return (
        <div className={styles.validationBar}>
            <Group spacing={8}>
                {errorCount > 0 && (
                    <Badge size="sm" color="red" variant="light">
                        {errorCount} error{errorCount > 1 ? 's' : ''}
                    </Badge>
                )}
                {warningCount > 0 && (
                    <Badge size="sm" color="yellow" variant="light">
                        {warningCount} warning{warningCount > 1 ? 's' : ''}
                    </Badge>
                )}
            </Group>
            <Group spacing={8} style={{ flex: 1, overflow: 'hidden' }} noWrap>
                {tabMessages.slice(0, 3).map((msg, i) => {
                    const config = SEVERITY_CONFIG[msg.severity];
                    const Icon = config.icon;
                    return (
                        <Group key={i} spacing={4} noWrap>
                            <Icon
                                size={14}
                                color={`var(--mantine-color-${config.color}-6)`}
                            />
                            <Text size="xs" color="dimmed" lineClamp={1}>
                                {msg.message}
                            </Text>
                        </Group>
                    );
                })}
            </Group>
        </div>
    );
};

export default ValidationBar;
