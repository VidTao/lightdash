import {
    ActionIcon,
    Badge,
    Box,
    Code,
    CopyButton,
    Group,
    Loader,
    Modal,
    Stack,
    Stepper,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
} from '@mantine/core';
import {
    IconCheck,
    IconClipboard,
    IconClipboardCheck,
    IconEye,
    IconEyeOff,
} from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import { useWebhookDiscovery } from '../hooks/useWebhookDiscovery';
import { useWebhookWriteKeys } from '../hooks/useWebhookWriteKeys';

interface WebhookSetupModalProps {
    opened: boolean;
    onClose: () => void;
    source: string;
    platformName: string;
    instructions?: string;
}

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
    leadbyte:
        'Go to LeadByte > Settings > Webhooks > Add a new webhook > Paste the URL and set the Authorization header.',
    slack_app:
        'Go to Slack API > Your App > Event Subscriptions > Set the Request URL to the webhook URL above.',
};

const CopyableCode = ({ value, label }: { value: string; label: string }) => (
    <Group spacing="xs" noWrap>
        <Code
            block
            sx={{
                flex: 1,
                fontSize: 13,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}
        >
            {value}
        </Code>
        <CopyButton value={value} timeout={2000}>
            {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : `Copy ${label}`} withArrow>
                    <ActionIcon
                        color={copied ? 'teal' : 'gray'}
                        onClick={copy}
                        variant="subtle"
                    >
                        {copied ? (
                            <IconClipboardCheck size={16} />
                        ) : (
                            <IconClipboard size={16} />
                        )}
                    </ActionIcon>
                </Tooltip>
            )}
        </CopyButton>
    </Group>
);

const WebhookSetupModal = ({
    opened,
    onClose,
    source,
    platformName,
    instructions,
}: WebhookSetupModalProps) => {
    const [showKey, setShowKey] = useState(false);
    const { keys, isLoading: keysLoading } = useWebhookWriteKeys(source);
    const { discovered, fields } = useWebhookDiscovery(source, opened);

    const autoCloseTimer = useRef<ReturnType<typeof setTimeout>>();

    // Auto-close 2s after discovery
    useEffect(() => {
        if (discovered && opened) {
            autoCloseTimer.current = setTimeout(() => {
                onClose();
            }, 2000);
        }
        return () => {
            if (autoCloseTimer.current) {
                clearTimeout(autoCloseTimer.current);
            }
        };
    }, [discovered, opened, onClose]);

    const webhookUrl =
        keys[0]?.webhookUrl ?? `https://api.bratrax.com/${source}/track`;
    const writeKey = keys[0]?.writeKey ?? '';
    const platformInstructions =
        instructions ?? PLATFORM_INSTRUCTIONS[source] ?? '';

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Title order={4}>Set up {platformName} Webhook</Title>}
            size="lg"
        >
            <Stack spacing="lg">
                <Stepper active={discovered ? 3 : -1} orientation="vertical">
                    <Stepper.Step
                        label="Webhook URL"
                        description="Copy this URL into your platform"
                    >
                        <CopyableCode value={webhookUrl} label="URL" />
                    </Stepper.Step>

                    <Stepper.Step
                        label="Authorization Header"
                        description="Add this as a Bearer token"
                    >
                        {keysLoading ? (
                            <Loader size="sm" />
                        ) : (
                            <Group spacing="xs" noWrap>
                                <CopyableCode
                                    value={`Bearer ${writeKey}`}
                                    label="token"
                                />
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => setShowKey((v) => !v)}
                                >
                                    {showKey ? (
                                        <IconEyeOff size={16} />
                                    ) : (
                                        <IconEye size={16} />
                                    )}
                                </ActionIcon>
                            </Group>
                        )}
                    </Stepper.Step>

                    <Stepper.Step
                        label="Send a test event"
                        description={platformInstructions}
                    >
                        {platformInstructions && (
                            <Text size="sm" color="dimmed">
                                {platformInstructions}
                            </Text>
                        )}
                    </Stepper.Step>
                </Stepper>

                {/* Live status indicator */}
                <Box
                    py="md"
                    px="lg"
                    sx={(theme) => ({
                        borderRadius: theme.radius.md,
                        backgroundColor: discovered
                            ? theme.colors.green[0]
                            : theme.colors.gray[0],
                        border: `1px solid ${
                            discovered
                                ? theme.colors.green[3]
                                : theme.colors.gray[3]
                        }`,
                    })}
                >
                    {discovered ? (
                        <Group spacing="sm">
                            <ThemeIcon
                                color="green"
                                variant="filled"
                                radius="xl"
                                size="md"
                            >
                                <IconCheck size={14} />
                            </ThemeIcon>
                            <Text size="sm" weight={600} color="green.8">
                                Schema discovered! {fields} fields found
                            </Text>
                            <Badge color="green" size="xs" ml="auto">
                                Auto-closing...
                            </Badge>
                        </Group>
                    ) : (
                        <Group spacing="sm">
                            <Loader size="xs" />
                            <Text size="sm" color="dimmed">
                                Waiting for test event...
                            </Text>
                        </Group>
                    )}
                </Box>
            </Stack>
        </Modal>
    );
};

export default WebhookSetupModal;
