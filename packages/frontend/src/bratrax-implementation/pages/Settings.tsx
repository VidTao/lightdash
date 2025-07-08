// // src/pages/Settings.tsx

import { Box, ScrollArea, Stack, Text, Title } from '@mantine/core';
import {
    IconAdjustments,
    IconApps,
    IconBuildingStore,
    IconChartBar,
    IconCurrencyDollar,
    IconFilter,
    IconPlugConnected,
    IconRocket,
    IconSettings,
    IconTarget,
    IconUsers,
} from '@tabler/icons-react';
import React, { useMemo } from 'react';
import {
    Navigate,
    useLocation,
    useRoutes,
    type RouteObject,
} from 'react-router';
import MantineIcon from '../../components/common/MantineIcon';
import Page from '../../components/common/Page/Page';
import PageBreadcrumbs from '../../components/common/PageBreadcrumbs';
import RouterNavLink from '../../components/common/RouterNavLink';
import Dashboard from './Dashboard';
import AppsExtensions from './settings/AppsExtensions';
import CostSettings from './settings/CostSettings';
import Integrations from './settings/Integrations';
import Periscope from './settings/periscope/index';
import Reports from './settings/Reports';
import Rules from './settings/Rules';
import Store from './settings/Store';
import Team from './settings/Team';
import TrackingSetup from './settings/TrackingSetup';

// Placeholder components for other settings sections
const GlobalFilters = () => <div>Global Filters</div>;

const FULL_WIDTH_KEYS = ['integrations', 'tracking'];

const Settings: React.FC = () => {
    const menuGroups = [
        // {
        //     label: 'General Settings',
        //     items: [
        //         {
        //             key: 'store',
        //             icon: <IconBuildingStore size={20} />,
        //             label: 'Store',
        //         },
        //         { key: 'team', icon: <IconUsers size={20} />, label: 'Team' },
        //     ],
        // },
        {
            label: 'Store Configurations',
            items: [
                {
                    key: 'reports',
                    icon: <IconChartBar size={20} />,
                    label: 'Reports',
                },
                {
                    key: 'integrations',
                    icon: <IconPlugConnected size={20} />,
                    label: 'Integrations',
                },
                {
                    key: 'apps',
                    icon: <IconApps size={20} />,
                    label: 'Apps & Extensions',
                },
                {
                    key: 'cost',
                    icon: <IconCurrencyDollar size={20} />,
                    label: 'Cost Settings',
                },
                {
                    key: 'tracking',
                    icon: <IconRocket size={20} />,
                    label: 'Tracking Setup',
                },
                {
                    key: 'periscope',
                    icon: <IconTarget size={20} />,
                    label: 'Periscope',
                },
                {
                    key: 'rules',
                    icon: <IconSettings size={20} />,
                    label: 'Rules',
                },
            ],
        },
        {
            label: 'Misc',
            items: [
                {
                    key: 'filters',
                    icon: <IconFilter size={20} />,
                    label: 'Global Filters',
                },
            ],
        },
    ];

    const routes = useMemo<RouteObject[]>(() => {
        const allowedRoutes: RouteObject[] = [
            {
                path: '/',
                element: <Navigate to="/storeSettings/reports" />,
            },
            // {
            //     path: '/store',
            //     element: <Store />,
            // },
            // {
            //     path: '/team',
            //     element: <Team />,
            // },
            {
                path: '/reports',
                element: <Reports />,
            },
            {
                path: '/integrations',
                element: <Dashboard />,
            },
            {
                path: '/apps',
                element: <AppsExtensions />,
            },
            {
                path: '/cost',
                element: <CostSettings />,
            },
            {
                path: '/tracking',
                element: <TrackingSetup />,
            },
            {
                path: '/periscope',
                element: <Periscope />,
            },
            {
                path: '/rules',
                element: <Rules />,
            },
            {
                path: '/filters',
                element: <GlobalFilters />,
            },
            {
                path: '*',
                element: <Navigate to="/storeSettings" />,
            },
        ];

        return allowedRoutes;
    }, []);

    const location = useLocation();

    // Helper to extract the key from the current path
    const getCurrentKey = () => {
        const match = location.pathname.match(/\/storeSettings\/([^/]+)/);
        return match ? match[1] : '';
    };

    const currentKey = getCurrentKey();
    const isFullWidth = FULL_WIDTH_KEYS.includes(currentKey);

    // Render the routed component manually
    let content: React.ReactNode;
    switch (currentKey) {
        case 'integrations':
            content = <Dashboard />;
            break;
        case 'tracking':
            content = <TrackingSetup />;
            break;
        case 'reports':
            content = <Reports />;
            break;
        case 'apps':
            content = <AppsExtensions />;
            break;
        case 'cost':
            content = <CostSettings />;
            break;
        case 'periscope':
            content = <Periscope />;
            break;
        case 'rules':
            content = <Rules />;
            break;
        case 'filters':
            content = <GlobalFilters />;
            break;
        default:
            content = <Navigate to="/storeSettings/reports" />;
    }

    return (
        <Page
            withFullHeight
            withSidebarFooter
            withFixedContent={!isFullWidth}
            withPaddedContent
            title="Settings"
            noContentMaxWidth={isFullWidth}
            sidebar={
                <Stack
                    sx={{
                        flexGrow: 1,
                        overflow: 'hidden',
                        minWidth: 250,
                        maxWidth: 300,
                        height: '100%',
                    }}
                >
                    <PageBreadcrumbs
                        items={[{ title: 'Settings', active: true }]}
                    />
                    <ScrollArea
                        variant="primary"
                        offsetScrollbars
                        scrollbarSize={8}
                        style={{ flex: 1, height: '100%' }}
                    >
                        <Stack spacing="lg">
                            {menuGroups.map((group) => (
                                <Box key={group.label}>
                                    <Title order={6} fw={600} mb="xs">
                                        {group.label}
                                    </Title>
                                    <Stack spacing={0}>
                                        {group.items.map((item) => (
                                            <RouterNavLink
                                                key={item.key}
                                                exact
                                                to={`/storeSettings/${item.key}`}
                                                label={item.label}
                                                icon={item.icon}
                                            />
                                        ))}
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    </ScrollArea>
                </Stack>
            }
        >
            {content}
        </Page>
    );
};

export default Settings;
