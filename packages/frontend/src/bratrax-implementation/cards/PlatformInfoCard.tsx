import { Group, List, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconCircle } from '@tabler/icons-react';

interface PlatformInfoCardProps {
    title: string;
    subtitle: string;
    image?: string;
    items: string[];
    isSelected: boolean;
    onClick: () => void;
}

const PlatformInfoCard = ({
    title,
    subtitle,
    image,
    items,
    isSelected,
    onClick,
}: PlatformInfoCardProps) => {
    return (
        <Paper
            shadow="sm"
            p="xl"
            radius="md"
            onClick={onClick}
            sx={(theme) => ({
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 200ms ease',
                border: isSelected
                    ? `2px solid ${theme.colors.blue[5]}`
                    : '2px solid transparent',
                backgroundColor: theme.white,

                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows.md,
                },
            })}
        >
            {isSelected && (
                <ThemeIcon
                    size="lg"
                    radius="xl"
                    color="blue"
                    sx={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                    }}
                >
                    <IconCheck size={20} />
                </ThemeIcon>
            )}

            <Stack spacing="md">
                <Group spacing="sm">
                    {image && (
                        <img
                            src={image}
                            alt={`${title} logo`}
                            style={{
                                width: 32,
                                height: 32,
                                objectFit: 'contain',
                            }}
                        />
                    )}
                    <Text
                        size="xl"
                        weight={600}
                        sx={(theme) => ({
                            color: theme.colors.gray[8],
                        })}
                    >
                        {title}
                    </Text>
                </Group>

                <Text
                    size="sm"
                    color="dimmed"
                    sx={{
                        lineHeight: 1.5,
                    }}
                >
                    {subtitle}
                </Text>

                <List
                    spacing="xs"
                    size="sm"
                    center
                    icon={
                        <ThemeIcon
                            size={8}
                            radius="xl"
                            color={isSelected ? 'blue' : 'gray'}
                            variant="filled"
                        >
                            <IconCircle size={8} />
                        </ThemeIcon>
                    }
                >
                    {items.map((item, index) => (
                        <List.Item
                            key={index}
                            sx={(theme) => ({
                                color: theme.colors.gray[7],
                            })}
                        >
                            {item}
                        </List.Item>
                    ))}
                </List>
            </Stack>
        </Paper>
    );
};

export default PlatformInfoCard;
