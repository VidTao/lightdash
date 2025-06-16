import {
    Box,
    Button,
    Checkbox,
    Group,
    Paper,
    Select,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDeviceFloppy } from '@tabler/icons-react';
import React from 'react';
import { PeriscopeEvent } from '../../../../models/interfaces';
import { apiService } from '../../../../services/api';

interface PlatformSettingsProps {
    title: string;
    description: string;
    connectionDescription: string;
    events: PeriscopeEvent[];
    connectionOptions: {
        value: string;
        label: string;
    }[];
    setSelectedAccountId: (id: string | null) => void;
    selectedAccountId: string | null;
    setEvents: React.Dispatch<React.SetStateAction<PeriscopeEvent[]>>;
}

const PlatformSettings: React.FC<PlatformSettingsProps> = ({
    title,
    description,
    connectionDescription,
    events,
    connectionOptions,
    setSelectedAccountId,
    selectedAccountId,
    setEvents,
}) => {
    const handleSave = async () => {
        try {
            await apiService.updatePeriscopeEvents(
                selectedAccountId ?? '',
                events
                    .filter((event) => event.isChecked)
                    .map((event) => event.eventId),
            );
            notifications.show({
                title: 'Success',
                message: 'Settings saved successfully',
                color: 'green',
            });
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: 'Failed to save settings',
                color: 'red',
            });
            console.error('Error saving settings:', error);
        }
    };

    const handleCheckboxChange = (eventId: string) => {
        setEvents((prevEvents) =>
            prevEvents.map((event) => {
                if (event.eventId === eventId) {
                    return { ...event, isChecked: !event.isChecked };
                }
                return event;
            }),
        );
    };

    return (
        <Box maw={768}>
            <Group position="apart" mb="lg">
                <Title order={2}>{title}</Title>
                <Button
                    leftIcon={<IconDeviceFloppy size={16} />}
                    onClick={handleSave}
                >
                    Save
                </Button>
            </Group>

            <Text c="dimmed" mb="xl">
                {description}
            </Text>

            <Paper withBorder p="md" mb="xl">
                <Stack>
                    <Title order={5}>Connection Details</Title>
                    <Text c="dimmed">{connectionDescription}</Text>
                    <Select
                        placeholder="Select Google Ads Account"
                        data={connectionOptions}
                        onChange={setSelectedAccountId}
                        value={selectedAccountId}
                    />
                </Stack>
            </Paper>

            {events.length > 0 && (
                <Stack>
                    <Title order={5}>Select Which Events to send</Title>
                    <Text c="dimmed">
                        Choose which events you would like to track.
                    </Text>

                    <Stack spacing="xs">
                        {events.map((event) => (
                            <Paper
                                key={event.name}
                                p="sm"
                                withBorder
                                sx={(theme) => ({
                                    '&:hover': {
                                        backgroundColor:
                                            theme.colorScheme === 'dark'
                                                ? theme.colors.dark[6]
                                                : theme.colors.gray[0],
                                    },
                                })}
                            >
                                <Checkbox
                                    checked={event.isChecked}
                                    onChange={() =>
                                        handleCheckboxChange(event.eventId)
                                    }
                                    label={
                                        <Stack spacing={2}>
                                            <Text fw={500}>{event.name}</Text>
                                            <Text size="sm" c="dimmed">
                                                {event.description}
                                            </Text>
                                        </Stack>
                                    }
                                />
                            </Paper>
                        ))}
                    </Stack>
                </Stack>
            )}
        </Box>
    );
};

export default PlatformSettings;
