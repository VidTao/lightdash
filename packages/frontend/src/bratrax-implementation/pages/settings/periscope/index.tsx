import {
    Box,
    Button,
    Card,
    Group,
    Stack,
    Switch,
    Text,
    Title,
} from '@mantine/core';
import {
    IconApi,
    IconBrandFacebook,
    IconBrandGoogle,
    IconBrandTiktok,
} from '@tabler/icons-react';
import React, { useState } from 'react';
import PeriscopeGoogleSettings from './platforms/PeriscopeGoogleSettings';
import PeriscopeKlaviyoSettings from './platforms/PeriscopeKlaviyoSettings';
import PeriscopeMetaSettings from './platforms/PeriscopeMetaSettings';
import PeriscopeTikTokSettings from './platforms/PeriscopeTikTokSettings';

interface PlatformState {
    enabled: boolean;
    selected: boolean;
}

const Periscope: React.FC = () => {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
        null,
    );
    const [defaultTab, setDefaultTab] = useState<'overview' | 'settings'>(
        'overview',
    );
    const [platformStates, setPlatformStates] = useState<
        Record<string, PlatformState>
    >({
        meta: { enabled: false, selected: false },
        google: { enabled: false, selected: false },
        klaviyo: { enabled: false, selected: false },
        tiktok: { enabled: false, selected: false },
    });

    const handleBack = () => {
        setSelectedPlatform(null);
    };

    const handleToggle = (platform: string, checked: boolean) => {
        setPlatformStates((prev) => ({
            ...prev,
            [platform]: { ...prev[platform], enabled: checked },
        }));
    };

    const handleViewDetails = (platform: string) => {
        if (platformStates[platform].enabled) {
            setDefaultTab('overview');
            setSelectedPlatform(platform);
        }
    };

    const handleConfigure = (platform: string) => {
        setDefaultTab('settings');
        setSelectedPlatform(platform);
    };

    if (selectedPlatform === 'meta') {
        return (
            <PeriscopeMetaSettings
                onBack={handleBack}
                defaultTab={defaultTab}
            />
        );
    }

    if (selectedPlatform === 'google') {
        return (
            <PeriscopeGoogleSettings
                onBack={handleBack}
                defaultTab={defaultTab}
            />
        );
    }

    if (selectedPlatform === 'klaviyo') {
        return (
            <PeriscopeKlaviyoSettings
                onBack={handleBack}
                defaultTab={defaultTab}
            />
        );
    }

    if (selectedPlatform === 'tiktok') {
        return (
            <PeriscopeTikTokSettings
                onBack={handleBack}
                defaultTab={defaultTab}
            />
        );
    }

    const platforms = [
        {
            key: 'meta',
            icon: <IconBrandFacebook size={24} color="#0866FF" />,
            label: 'Meta Conversions API (CAPI)',
        },
        {
            key: 'google',
            icon: <IconBrandGoogle size={24} color="#4285F4" />,
            label: 'Google Ads',
        },
        {
            key: 'klaviyo',
            icon: <IconApi size={24} color="#1C1D1F" />,
            label: 'Klaviyo',
        },
        {
            key: 'tiktok',
            icon: <IconBrandTiktok size={24} color="#000000" />,
            label: 'TikTok',
        },
    ];

    return (
        <Box p="xl">
            <Stack mb="xl">
                <Title order={4}>Destinations</Title>
                <Text c="dimmed">
                    Check your data status, connect and disconnect integrations
                    and manage settings.
                </Text>
            </Stack>

            <Stack spacing="lg">
                {platforms.map((platform) => (
                    <Card key={platform.key} withBorder>
                        <Stack spacing="md">
                            <Group position="apart">
                                <Group spacing="md">
                                    {platform.icon}
                                    <Text fw={500}>{platform.label}</Text>
                                </Group>
                                <Switch
                                    checked={
                                        platformStates[platform.key].enabled
                                    }
                                    onChange={(event) =>
                                        handleToggle(
                                            platform.key,
                                            event.currentTarget.checked,
                                        )
                                    }
                                />
                            </Group>
                            <Group spacing="sm">
                                <Button
                                    variant="light"
                                    onClick={() =>
                                        handleViewDetails(platform.key)
                                    }
                                    disabled={
                                        !platformStates[platform.key].enabled
                                    }
                                >
                                    View Details
                                </Button>
                                <Button
                                    onClick={() =>
                                        handleConfigure(platform.key)
                                    }
                                >
                                    Configure
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                ))}
            </Stack>
        </Box>
    );
};

export default Periscope;
