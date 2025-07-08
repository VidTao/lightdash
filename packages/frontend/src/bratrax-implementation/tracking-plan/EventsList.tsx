import { ActionIcon, Box, Group, Paper, Stack, Text } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useState } from 'react';
import EventDescription from './EventDescription';
import PropertiesList from './PropertiesList';
import SelectionCheckbox from './SelectionCheckbox';
import { StandardEvent } from './types';

interface EventsListProps {
    events: StandardEvent[];
    selectedEvents: StandardEvent[];
    onEventSelect: (eventId: string) => void;
    onPropertySelect: (eventId: string, propertyId: string) => void;
}

const EventsList = ({
    events,
    selectedEvents,
    onEventSelect,
    onPropertySelect,
}: EventsListProps) => {
    const [expandedEvents, setExpandedEvents] = useState<string[]>([]);

    const toggleExpand = (eventId: string) => {
        setExpandedEvents((prev) =>
            prev.includes(eventId)
                ? prev.filter((id) => id !== eventId)
                : [...prev, eventId],
        );
    };

    return (
        <Box mt="xl" sx={{ maxHeight: 'calc(65vh)', overflowY: 'auto' }} p="md">
            <EventDescription
                title="Standard Events"
                description="Pre-configured events specific to Shopify"
            />
            <Stack spacing="md">
                {events.map((event) => (
                    <Paper
                        key={event.id}
                        shadow="sm"
                        p="md"
                        onClick={() => onEventSelect(event.id)}
                        sx={{ cursor: 'pointer' }}
                    >
                        <Group position="apart" noWrap>
                            <Group spacing="md" sx={{ flex: 1 }}>
                                <Group spacing="md">
                                    <SelectionCheckbox
                                        checked={selectedEvents.some(
                                            (e) => e.id === event.id,
                                        )}
                                        onChange={() => onEventSelect(event.id)}
                                    />
                                    <Text size="lg" weight={600}>
                                        {event.name}
                                    </Text>
                                </Group>
                            </Group>
                            <ActionIcon
                                onClick={(
                                    e: React.MouseEvent<HTMLButtonElement>,
                                ) => {
                                    e.stopPropagation();
                                    toggleExpand(event.id);
                                }}
                                variant="subtle"
                                radius="xl"
                            >
                                {expandedEvents.includes(event.id) ? (
                                    <IconChevronUp size={20} />
                                ) : (
                                    <IconChevronDown size={20} />
                                )}
                            </ActionIcon>
                        </Group>
                        <Text size="sm" color="dimmed" mt="xs" ml={42}>
                            {event.description}
                        </Text>

                        {expandedEvents.includes(event.id) && (
                            <Box
                                onClick={(
                                    e: React.MouseEvent<HTMLDivElement>,
                                ) => e.stopPropagation()}
                                mt="md"
                            >
                                <PropertiesList
                                    properties={event.properties}
                                    selectedProperties={
                                        selectedEvents.find(
                                            (e) => e.id === event.id,
                                        )?.properties ?? []
                                    }
                                    eventId={event.id}
                                    onPropertySelect={onPropertySelect}
                                />
                            </Box>
                        )}
                    </Paper>
                ))}
            </Stack>
        </Box>
    );
};

export default EventsList;
