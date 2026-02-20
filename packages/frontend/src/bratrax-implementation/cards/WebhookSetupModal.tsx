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
    Text,
    ThemeIcon,
    Title,
    Tooltip,
} from '@mantine/core';
import {
    IconCheck,
    IconCircleNumber1,
    IconCircleNumber2,
    IconCircleNumber3,
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
                padding: '10px 12px',
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

const StepLabel = ({
    icon: Icon,
    label,
}: {
    icon: typeof IconCircleNumber1;
    label: string;
}) => (
    <Group spacing="xs" mb={6}>
        <Icon size={20} color="gray" />
        <Text size="sm" weight={600} color="gray.7">
            {label}
        </Text>
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

    const autoCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const maskedKey = writeKey
        ? `${writeKey.slice(0, 6)}${'*'.repeat(Math.max(0, writeKey.length - 6))}`
        : '';
    const bearerValue = `Bearer ${showKey ? writeKey : maskedKey || '...'}`;
    const platformInstructions =
        instructions ?? PLATFORM_INSTRUCTIONS[source] ?? '';

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={<Title order={4}>Set up {platformName} Webhook</Title>}
            size="lg"
        >
            <Stack spacing="xl">
                {/* Step 1: Webhook URL */}
                <Box>
                    <StepLabel icon={IconCircleNumber1} label="Webhook URL" />
                    <Text size="xs" color="dimmed" mb="xs">
                        Copy this URL and paste it into your platform&apos;s
                        webhook settings.
                    </Text>
                    <CopyableCode value={webhookUrl} label="URL" />
                </Box>

                {/* Step 2: Auth header */}
                <Box>
                    <StepLabel
                        icon={IconCircleNumber2}
                        label="Authorization Header"
                    />
                    <Text size="xs" color="dimmed" mb="xs">
                        Add this as the Authorization header value.
                    </Text>
                    {keysLoading ? (
                        <Group spacing="xs">
                            <Loader size="xs" />
                            <Text size="sm" color="dimmed">
                                Loading write key...
                            </Text>
                        </Group>
                    ) : writeKey ? (
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
                    ) : (
                        <Code block sx={{ fontSize: 13, padding: '10px 12px' }}>
                            {bearerValue}
                        </Code>
                    )}
                </Box>

                {/* Step 3: Instructions */}
                <Box>
                    <StepLabel
                        icon={IconCircleNumber3}
                        label="Send a test event"
                    />
                    {platformInstructions ? (
                        <Text size="xs" color="dimmed">
                            {platformInstructions}
                        </Text>
                    ) : (
                        <Text size="xs" color="dimmed">
                            Send a POST request with a JSON body to the webhook
                            URL above.
                        </Text>
                    )}
                </Box>

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
