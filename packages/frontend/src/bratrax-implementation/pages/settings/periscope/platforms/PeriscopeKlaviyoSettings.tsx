import { Box, Group, Stack, Tabs, Title, UnstyledButton } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useAdConnections } from '../../../../hooks/useAdConnections';
import { usePeriscopeEvents } from '../../../../hooks/usePeriscopeEvents';
import DeliveryOverview from '../components/DeliveryOverview';
import PlatformSettings from '../components/PlatformSettings';
import { klaviyoDeliveryData } from '../data/klaviyo';
import { PlatformSettingsProps } from '../types';

const PeriscopeKlaviyoSettings: React.FC<PlatformSettingsProps> = ({
    onBack,
    defaultTab = 'overview',
}) => {
    const { adConnections } = useAdConnections({
        platformName: 'Klaviyo',
        setIsLoading: () => {},
    });
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
        null,
    );
    const { events: periscopeEvents, setEvents: setPeriscopeEvents } =
        usePeriscopeEvents(selectedAccountId);

    const klaviyoConnectionOptions = adConnections.map((connection) => ({
        value: connection.accountId,
        label: connection.accountName,
    }));

    return (
        <Box p="xl">
            <Stack mb="xl">
                <UnstyledButton
                    onClick={onBack}
                    sx={(theme) => ({
                        color: theme.colors.blue[6],
                        '&:hover': {
                            color: theme.colors.blue[7],
                        },
                    })}
                >
                    <Group spacing="xs">
                        <IconArrowLeft size={16} />
                        <span>Back to Periscope</span>
                    </Group>
                </UnstyledButton>
                <Title order={4}>Klaviyo</Title>
            </Stack>

            <Tabs defaultValue={defaultTab}>
                <Tabs.List>
                    <Tabs.Tab value="overview">Delivery Overview</Tabs.Tab>
                    <Tabs.Tab value="settings">Settings</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt="xl">
                    <DeliveryOverview
                        title="Delivery Overview"
                        description="Review a summary of enriched events being sent to Klaviyo."
                        data={klaviyoDeliveryData}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="settings" pt="xl">
                    <PlatformSettings
                        title="Settings"
                        description="Configure your connection and choose which events to send to Klaviyo."
                        connectionDescription="Enter your Klaviyo API key to establish the connection."
                        events={periscopeEvents}
                        connectionOptions={klaviyoConnectionOptions}
                        setSelectedAccountId={setSelectedAccountId}
                        selectedAccountId={selectedAccountId}
                        setEvents={setPeriscopeEvents}
                    />
                </Tabs.Panel>
            </Tabs>
        </Box>
    );
};

export default PeriscopeKlaviyoSettings;
