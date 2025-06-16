import { Box, Group, Paper, Stack, Text, Title } from '@mantine/core';
import React from 'react';
import ClickFunnel2Connector from '../../platforms/ClickFunnel2Connector';
import FacebookAdsConnector from '../../platforms/FacebookAdsConnector';
import GoHighLevelConnector from '../../platforms/GoHighLevelConnector';
import GoogleAdsConnector from '../../platforms/GoogleAdsConnector';
import ClaviyoConnector from '../../platforms/KlaviyoConnector';
import PinterestConnector from '../../platforms/PinterestConnector';
import ShopifyConnector from '../../platforms/ShopifyConnector';
import StripeConnector from '../../platforms/StripeConnector';

const Integrations: React.FC = () => {
    return (
        <Box p="xl">
            <Stack mb="xl">
                <Title order={2}>Integrations</Title>
                <Text c="dimmed">
                    Connect your store with third-party platforms
                </Text>
            </Stack>

            <Paper p="md" radius="md" withBorder>
                <Stack mb="xl">
                    <Title order={4}>Connected Platforms</Title>
                    <Text c="dimmed">
                        Manage your platform integrations and connections
                    </Text>
                </Stack>

                <Group align="center" spacing="lg" grow>
                    <GoogleAdsConnector />
                    <FacebookAdsConnector />
                    <GoHighLevelConnector />
                    <PinterestConnector />
                    <ClickFunnel2Connector />
                    <ShopifyConnector />
                    <ClaviyoConnector />
                    <StripeConnector />
                </Group>
            </Paper>
        </Box>
    );
};

export default Integrations;
