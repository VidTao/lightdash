import { Box, Container, SimpleGrid, Title } from '@mantine/core';
import { useEffect } from 'react';
import useApp from '../../providers/App/useApp';
import { AmazonAdsConnector } from '../platforms/AmazonAdsConnector';
import { AmazonSPConnector } from '../platforms/AmazonSPConnector';
import ClickFunnel2Connector from '../platforms/ClickFunnel2Connector';
import FacebookAdsConnector from '../platforms/FacebookAdsConnector';
import GoHighLevelConnector from '../platforms/GoHighLevelConnector';
import GoogleAdsConnector from '../platforms/GoogleAdsConnector';
import ClaviyoConnector from '../platforms/KlaviyoConnector';
import OutbrainConnector from '../platforms/OutbrainConnector';
import PinterestConnector from '../platforms/PinterestConnector';
import ShopifyConnector from '../platforms/ShopifyConnector';
import StripeConnector from '../platforms/StripeConnector';
import TaboolaConnector from '../platforms/TaboolaConnector';
import { apiService } from '../services/api';

const Dashboard = () => {
    const { user } = useApp();
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
                    const applicationUser =
                        await apiService.getApplicationUser();
                    // setApplicationUser(applicationUser);
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

        handlePendingShopifyAuth();
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
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <GoogleAdsConnector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <FacebookAdsConnector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <GoHighLevelConnector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <PinterestConnector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ClickFunnel2Connector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ShopifyConnector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <ClaviyoConnector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <StripeConnector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonSPConnector region="us" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonSPConnector region="eu" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonSPConnector region="fe" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonAdsConnector region="us" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonAdsConnector region="eu" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <AmazonAdsConnector region="fe" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <OutbrainConnector />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <TaboolaConnector />
                    </Box>
                </SimpleGrid>
            </Container>
        </Box>
    );
};

export default Dashboard;
