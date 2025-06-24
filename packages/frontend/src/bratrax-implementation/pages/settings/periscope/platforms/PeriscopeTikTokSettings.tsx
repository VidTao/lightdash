import { Box, Group, Stack, Tabs, Title, UnstyledButton } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import React, { useState } from 'react';
import { useAdConnections } from '../../../../hooks/useAdConnections';
import { usePeriscopeEvents } from '../../../../hooks/usePeriscopeEvents';
import {
    tiktokConnectionOptions,
    tiktokDeliveryData,
    tiktokEvents,
} from '../component-data/tiktok';
import DeliveryOverview from '../components/DeliveryOverview';
import PlatformSettings from '../components/PlatformSettings';
import { PlatformSettingsProps } from '../types';

const PeriscopeTikTokSettings: React.FC<PlatformSettingsProps> = ({
    onBack,
    defaultTab = 'overview',
}) => {
    const { adConnections } = useAdConnections({
        platformName: 'TikTok',
        setIsLoading: () => {},
    });
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
        null,
    );
    const { events: periscopeEvents, setEvents: setPeriscopeEvents } =
        usePeriscopeEvents(selectedAccountId);

    const tiktokConnectionOptions = adConnections.map((connection) => ({
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
                <Title order={4}>TikTok</Title>
            </Stack>

            <Tabs defaultValue={defaultTab}>
                <Tabs.List>
                    <Tabs.Tab value="overview">Delivery Overview</Tabs.Tab>
                    <Tabs.Tab value="settings">Settings</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" pt="xl">
                    <DeliveryOverview
                        title="Delivery Overview"
                        description="Review a summary of enriched events being sent to TikTok."
                        data={tiktokDeliveryData}
                    />
                </Tabs.Panel>

                <Tabs.Panel value="settings" pt="xl">
                    <PlatformSettings
                        title="Settings"
                        description="Configure your connection and choose which events to send to TikTok."
                        connectionDescription="Enter your TikTok Pixel ID and access token to establish the connection."
                        events={periscopeEvents}
                        setEvents={setPeriscopeEvents}
                        selectedAccountId={selectedAccountId}
                        setSelectedAccountId={setSelectedAccountId}
                        connectionOptions={tiktokConnectionOptions}
                    />
                </Tabs.Panel>
            </Tabs>
        </Box>
    );
};

export default PeriscopeTikTokSettings;
