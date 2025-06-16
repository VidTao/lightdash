import { Box, Group, Paper, Text, ThemeIcon } from '@mantine/core';
import {
    IconArrowRight,
    IconCheck,
    IconInfoCircle,
    IconLoader,
} from '@tabler/icons-react';

interface PlatformCardProps {
    handleLogin: () => void;
    isLoading: boolean;
    platformName: string;
    logoPath: string;
    description: string;
    isConnected?: boolean;
    handleNavigate?: () => void;
    connectedOn?: string;
}

const PlatformCard = ({
    handleLogin,
    isLoading,
    platformName,
    logoPath,
    description,
    isConnected,
    handleNavigate,
    connectedOn,
}: PlatformCardProps) => {
    return (
        <Paper
            onClick={isConnected ? handleNavigate : handleLogin}
            shadow="sm"
            p="xl"
            radius="md"
            sx={(theme) => ({
                width: 280,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 200ms ease',
                border: `1px solid ${
                    isConnected ? theme.colors.green[2] : theme.colors.gray[2]
                }`,
                opacity: isLoading ? 0.7 : 1,

                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows.md,
                    backgroundColor: isConnected
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
            </Group>

            {isConnected && (
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
                {isConnected ? (
                    <Box>
                        <Text size="sm" color="gray.6" mb={8}>
                            Connected on:{' '}
                            <Text span weight={600}>
                                {connectedOn}
                            </Text>
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
                                See connection details
                            </Text>
                            <IconInfoCircle size={16} color="green" />
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
                    color: isConnected
                        ? theme.colors.green[6]
                        : theme.colors.blue[6],
                    fontWeight: 500,
                })}
            >
                <Text size="sm">
                    {isLoading
                        ? 'Connecting...'
                        : isConnected
                        ? 'Connected'
                        : 'Connect Account'}
                </Text>
                {!isConnected &&
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

export default PlatformCard;
