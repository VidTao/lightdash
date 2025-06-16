import { Box, Stack, Text, Title } from '@mantine/core';
import React from 'react';
import TrackingPlan from '../../tracking-plan/TrackingPlan';

const TrackingSetup: React.FC = () => {
    return (
        <Box p="xl">
            <Stack mb="xl">
                <Title order={4}>Tracking Setup</Title>
                <Text c="dimmed">
                    Configure your tracking plan and manage event tracking
                </Text>
            </Stack>

            <Box>
                <TrackingPlan />
            </Box>
        </Box>
    );
};

export default TrackingSetup;
