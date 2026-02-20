import { Badge, Box, Group, Paper, Text, ThemeIcon } from '@mantine/core';
import {
    IconArrowRight,
    IconCheck,
    IconLoader,
    IconWebhook,
} from '@tabler/icons-react';

interface WebhookCardProps {
    platformName: string;
    logoPath: string;
    description: string;
    discovered: boolean;
    fields: number;
    streams: number;
    onSetup: () => void;
    onDetails: () => void;
    isLoading: boolean;
}

const WebhookCard = ({
    platformName,
    logoPath,
    description,
    discovered,
    fields,
    streams,
    onSetup,
    onDetails,
    isLoading,
}: WebhookCardProps) => {
    return (
        <Paper
            onClick={discovered ? onDetails : onSetup}
            shadow="sm"
            p="xl"
            radius="md"
            sx={(theme) => ({
                width: 280,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 200ms ease',
                border: `1px solid ${
                    discovered ? theme.colors.green[2] : theme.colors.gray[2]
                }`,
                opacity: isLoading ? 0.7 : 1,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows.md,
                    backgroundColor: discovered
                        ? theme.fn.rgba(theme.colors.green[0], 0.5)
                        : theme.fn.rgba(theme.colors.blue[0], 0.5),
                },
            })}
        >
            <Box mb="md" h={35}>
                <img
                    style={{
                        height: '100%',
                        width: 'auto',
                        objectFit: 'contain',
                    }}
                    src={`/images/${logoPath}`}
                    alt={platformName}
                />
            </Box>

            <Group mb="xs">
                <Text weight={600} size="lg" color="gray.8">
                    {platformName}
                </Text>
                <Badge
                    size="xs"
                    variant="outline"
                    color="violet"
                    leftSection={<IconWebhook size={10} />}
                >
                    Webhook
                </Badge>
            </Group>

            {discovered && (
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                    <ThemeIcon
                        color="green"
                        variant="light"
                        size="md"
                        radius="xl"
                    >
                        <IconCheck size={16} />
                    </ThemeIcon>
                </Box>
            )}

            <Box mb="md">
                {discovered ? (
                    <Box>
                        <Text size="sm" color="gray.6" mb={8}>
                            {fields} fields discovered across {streams}{' '}
                            {streams === 1 ? 'stream' : 'streams'}
                        </Text>
                        <Group
                            spacing="xs"
                            sx={(theme) => ({
                                backgroundColor: theme.colors.green[0],
                                padding: '6px 12px',
                                borderRadius: theme.radius.xl,
                                display: 'inline-flex',
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: theme.colors.green[1],
                                },
                            })}
                        >
                            <Text size="sm" color="green.7">
                                See details
                            </Text>
                        </Group>
                    </Box>
                ) : (
                    <Text size="sm" color="gray.6">
                        {description}
                    </Text>
                )}
            </Box>

            <Group
                spacing="xs"
                sx={(theme) => ({
                    color: discovered
                        ? theme.colors.green[6]
                        : theme.colors.blue[6],
                    fontWeight: 500,
                })}
            >
                <Text size="sm">
                    {isLoading
                        ? 'Loading...'
                        : discovered
                          ? 'Discovered'
                          : 'Set up webhook'}
                </Text>
                {!discovered &&
                    (isLoading ? (
                        <IconLoader size={16} className="animate-spin" />
                    ) : (
                        <IconArrowRight
                            size={16}
                            className="animate-bounce"
                            style={{ animationDuration: '2s' }}
                        />
                    ))}
            </Group>
        </Paper>
    );
};

export default WebhookCard;
