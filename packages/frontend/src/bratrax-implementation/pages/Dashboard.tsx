import {
    Box,
    Container,
    Divider,
    SimpleGrid,
    Text,
    Title,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import useApp from '../../providers/App/useApp';
import WebhookCard from '../cards/WebhookCard';
import WebhookDetailsModal from '../cards/WebhookDetailsModal';
import WebhookSetupModal from '../cards/WebhookSetupModal';
import { useAdConnections } from '../hooks/useAdConnections';
import { useCrmConnections } from '../hooks/useCrmConnections';
import { usePlatformConnections } from '../hooks/usePlatformConnections';
import { useWebhookDiscovery } from '../hooks/useWebhookDiscovery';
import { AmazonAdsConnector } from '../platforms/AmazonAdsConnector';
import { AmazonSPConnector } from '../platforms/AmazonSPConnector';
import ClickFunnel2Connector from '../platforms/ClickFunnel2Connector';
import FacebookAdsConnector from '../platforms/FacebookAdsConnector';
import GoHighLevelConnector from '../platforms/GoHighLevelConnector';
import GoogleAdsConnector from '../platforms/GoogleAdsConnector';
import KlaviyoConnector from '../platforms/KlaviyoConnector';
import OutbrainConnector from '../platforms/OutbrainConnector';
import PinterestConnector from '../platforms/PinterestConnector';
import ShopifyConnector from '../platforms/ShopifyConnector';
import StripeConnector from '../platforms/StripeConnector';
import TaboolaConnector from '../platforms/TaboolaConnector';
import { TikTokAdsConnector } from '../platforms/TikTokAdsConnector';
import { apiService } from '../services/api';

type WebhookSource = {
    source: string;
    platformName: string;
    logoPath: string;
    description: string;
};

const WEBHOOK_SOURCES: WebhookSource[] = [
    {
        source: 'leadbyte',
        platformName: 'LeadByte',
        logoPath: 'leadbyte-logo.png',
        description: 'Receive lead events from LeadByte via webhook',
    },
    {
        source: 'slack_app',
        platformName: 'Slack App',
        logoPath: 'slack-logo.png',
        description: 'Receive events from your Slack workspace',
    },
];

const WebhookCardConnector = ({
    ws,
    onSetup,
    onDetails,
}: {
    ws: WebhookSource;
    onSetup: () => void;
    onDetails: () => void;
}) => {
    const { discovered, fields, streams } = useWebhookDiscovery(
        ws.source,
        true,
    );

    return (
        <WebhookCard
            platformName={ws.platformName}
            logoPath={ws.logoPath}
            description={ws.description}
            discovered={discovered}
            fields={fields}
            streams={streams}
            onSetup={onSetup}
            onDetails={onDetails}
            isLoading={false}
        />
    );
};

const Dashboard = () => {
    useApp();

    // Call hooks at the top level
    const { crmConnections, isLoading: crmLoading } = useCrmConnections();
    const { adConnections, isLoading: adLoading } = useAdConnections();
    const { platformConnections, isLoading: platformLoading } =
        usePlatformConnections();

    // Webhook modal state
    const [setupSource, setSetupSource] = useState<WebhookSource | null>(null);
    const [detailsSource, setDetailsSource] = useState<WebhookSource | null>(
        null,
    );

    useEffect(() => {
        const handlePendingShopifyAuth = async () => {
            const pendingShopifyAuth =
                localStorage.getItem('pendingShopifyAuth'); //checking if there is a pending shopify auth
            if (pendingShopifyAuth) {
                // setIsLoading(true);
                try {
                    const { code, shop } = JSON.parse(pendingShopifyAuth);
                    await apiService.generateShopifyTokensDataAndSaveinBQ(
                        code,
                        shop,
                    );
                    await apiService.getApplicationUser();
                    localStorage.removeItem('pendingShopifyAuth'); // Clean up
                } catch (error) {
                    console.error(
                        'Error processing pending Shopify auth:',
                        error,
                    );
                    localStorage.removeItem('pendingShopifyAuth'); // Clean up on error
                }
                // setIsLoading(false);
            }
        };

        void handlePendingShopifyAuth();
    }, []);

    return (
        <Box
            sx={{
                width: '100%',
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Container size="xl" pb={150}>
                <Title
                    order={1}
                    align="center"
                    mt={48}
                    mb={48}
                    sx={(theme) => ({
                        color: theme.colors.gray[8],
                        fontWeight: 600,
                        letterSpacing: '0.5px',
                    })}
                >
                    Connect to platforms
                </Title>

                <SimpleGrid
                    cols={4}
                    spacing={26}
                    breakpoints={[
                        { maxWidth: 'lg', cols: 3 },
                        { maxWidth: 'md', cols: 2 },
                        { maxWidth: 'sm', cols: 1 },
                    ]}
                    sx={{
                        maxWidth: 1200,
                        margin: '0 auto',
                        marginTop: 50,
                    }}
                >
                    {/* Pass data as props to connector components */}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleAdsConnector
                            adConnections={adConnections.Google || []}
                            platformConnection={platformConnections.Google}
                            isLoading={adLoading || platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <FacebookAdsConnector
                            adConnections={adConnections.Facebook || []}
                            platformConnection={platformConnections.Facebook}
                            isLoading={adLoading || platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <GoHighLevelConnector
                            platformConnection={platformConnections.GoHighLevel}
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <PinterestConnector
                            platformConnection={platformConnections.Pinterest}
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ClickFunnel2Connector
                            platformConnection={
                                platformConnections.ClickFunnel2
                            }
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ShopifyConnector
                            crmConnections={crmConnections.Shopify || []}
                            platformConnection={platformConnections.Shopify}
                            isLoading={crmLoading || platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <KlaviyoConnector
                            platformConnection={platformConnections.Klaviyo}
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <StripeConnector
                            platformConnection={platformConnections.Stripe}
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonSPConnector
                            region="us"
                            crmConnections={crmConnections['AmazonSP-US'] || []}
                            platformConnection={
                                platformConnections['AmazonSP-US']
                            }
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonSPConnector
                            region="eu"
                            crmConnections={crmConnections['AmazonSP-EU'] || []}
                            platformConnection={
                                platformConnections['AmazonSP-EU']
                            }
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonSPConnector
                            region="fe"
                            crmConnections={crmConnections['AmazonSP-FE'] || []}
                            platformConnection={
                                platformConnections['AmazonSP-FE']
                            }
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonAdsConnector
                            region="us"
                            adConnections={adConnections['AmazonAds-US'] || []}
                            platformConnection={
                                platformConnections['AmazonAds-US']
                            }
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonAdsConnector
                            region="eu"
                            adConnections={adConnections['AmazonAds-EU'] || []}
                            platformConnection={
                                platformConnections['AmazonAds-EU']
                            }
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonAdsConnector
                            region="fe"
                            adConnections={adConnections['AmazonAds-FE'] || []}
                            platformConnection={
                                platformConnections['AmazonAds-FE']
                            }
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <OutbrainConnector
                            crmConnections={crmConnections.Outbrain || []}
                            platformConnection={platformConnections.Outbrain}
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <TaboolaConnector
                            crmConnections={crmConnections.Taboola || []}
                            platformConnection={platformConnections.Taboola}
                            isLoading={platformLoading}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <TikTokAdsConnector
                            adConnections={adConnections.TikTokAds || []}
                            platformConnection={platformConnections.TikTokAds}
                            isLoading={adLoading || platformLoading}
                        />
                    </Box>
                </SimpleGrid>

                {/* Webhook Sources Section */}
                <Divider
                    my="xl"
                    label={
                        <Text size="sm" weight={600} color="dimmed">
                            Webhook Sources
                        </Text>
                    }
                    labelPosition="center"
                />

                <SimpleGrid
                    cols={4}
                    spacing={26}
                    breakpoints={[
                        { maxWidth: 'lg', cols: 3 },
                        { maxWidth: 'md', cols: 2 },
                        { maxWidth: 'sm', cols: 1 },
                    ]}
                    sx={{
                        maxWidth: 1200,
                        margin: '0 auto',
                    }}
                >
                    {WEBHOOK_SOURCES.map((ws) => (
                        <Box
                            key={ws.source}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <WebhookCardConnector
                                ws={ws}
                                onSetup={() => setSetupSource(ws)}
                                onDetails={() => setDetailsSource(ws)}
                            />
                        </Box>
                    ))}
                </SimpleGrid>
            </Container>

            {/* Webhook Setup Modal */}
            {setupSource && (
                <WebhookSetupModal
                    opened={!!setupSource}
                    onClose={() => setSetupSource(null)}
                    source={setupSource.source}
                    platformName={setupSource.platformName}
                />
            )}

            {/* Webhook Details Modal */}
            {detailsSource && (
                <WebhookDetailsModal
                    opened={!!detailsSource}
                    onClose={() => setDetailsSource(null)}
                    source={detailsSource.source}
                    platformName={detailsSource.platformName}
                />
            )}
        </Box>
    );
};

export default Dashboard;
