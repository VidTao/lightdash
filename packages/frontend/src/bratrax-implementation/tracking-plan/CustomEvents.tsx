import { Box, Button, Paper, Stack, Text, Title } from '@mantine/core';
import { IconCirclePlus } from '@tabler/icons-react';
import { useState } from 'react';
import AddCustomEvent from '../modals/AddCustomEventModal';
import { apiService } from '../services/api';
import { Property } from './types';
// import { useLoading } from '../../context/LoadingContext';

interface CustomEventsProps {
    properties: Property[];
    onEventCreated: (event: any) => void;
}

const CustomEventsCreator = ({
    properties,
    onEventCreated,
}: CustomEventsProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const { setIsLoading } = useLoading();
    const handleSubmit = async (values: any) => {
        // setIsLoading(true);
        const response = await apiService.insertCustomEvent(values);
        onEventCreated(response);
        // setIsLoading(false);
    };

    return (
        <Box mt="xl" sx={{ maxHeight: 'calc(65vh)', overflowY: 'auto' }} p="md">
            <Paper shadow="sm" p="xl" withBorder>
                <Stack align="center" spacing="sm">
                    <IconCirclePlus
                        size={48}
                        color="var(--mantine-color-gray-5)"
                    />
                    <Title order={3}>Create New Event</Title>
                    <Text size="sm" color="dimmed">
                        Add your custom event definition
                    </Text>
                    <Button onClick={() => setIsModalOpen(true)} mt="md">
                        Create custom event
                    </Button>
                </Stack>
            </Paper>

            <AddCustomEvent
                properties={properties}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
            />
        </Box>
    );
};

export default CustomEventsCreator;
