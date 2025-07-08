import {
    Box,
    Button,
    Card,
    Container,
    Grid,
    Group,
    List,
    Paper,
    Stack,
    Stepper,
    Text,
    Title,
} from '@mantine/core';
import {
    IconBrandChrome,
    IconCheck,
    IconDownload,
    IconRocket,
} from '@tabler/icons-react';

const AppsExtensions = () => {
    const handleInstallClick = () => {
        // Replace with your actual Chrome extension URL
        window.open(
            'https://chrome.google.com/webstore/your-extension-url',
            '_blank',
        );
    };

    return (
        <Box p="xl">
            <Stack mb="xl">
                <Title order={2}>Apps & Extensions</Title>
                <Text c="dimmed">
                    Enhance your experience with our browser extensions
                </Text>
            </Stack>

            <Stack spacing="xl">
                {/* Chrome Extension Card */}
                <Card
                    radius="md"
                    sx={(theme) => ({
                        background: theme.fn.gradient({
                            from: theme.colors.blue[0],
                            to: 'white',
                            deg: 90,
                        }),
                    })}
                >
                    <Group align="flex-start" spacing="xl" noWrap>
                        <Box style={{ flex: 1 }}>
                            <Group mb="md" spacing="xs">
                                <IconBrandChrome size={24} color="#4285F4" />
                                <Title order={4}>Chrome Extension</Title>
                            </Group>

                            <Text mb="md">
                                Supercharge your analytics and tracking
                                capabilities with our Chrome extension. Get
                                instant access to:
                            </Text>

                            <List mb="xl">
                                <List.Item>
                                    Real-time performance monitoring
                                </List.Item>
                                <List.Item>
                                    Quick access to your dashboard
                                </List.Item>
                                <List.Item>
                                    Instant notifications and alerts
                                </List.Item>
                                <List.Item>
                                    Easy data collection and tracking
                                </List.Item>
                            </List>

                            <Button
                                size="md"
                                leftIcon={<IconDownload size={16} />}
                                onClick={handleInstallClick}
                                mb="xl"
                            >
                                Install Chrome Extension
                            </Button>

                            <Title order={5} mb="md">
                                Installation Guide
                            </Title>
                            <Stepper
                                active={-1}
                                orientation="vertical"
                                size="sm"
                            >
                                <Stepper.Step
                                    label="Click Install"
                                    description="Click the install button above to go to the Chrome Web Store"
                                    icon={<IconDownload size={16} />}
                                />
                                <Stepper.Step
                                    label="Add to Chrome"
                                    description="Click 'Add to Chrome' in the Web Store and confirm the installation"
                                    icon={<IconBrandChrome size={16} />}
                                />
                                <Stepper.Step
                                    label="Pin Extension"
                                    description="Click the puzzle piece icon in Chrome and pin the extension for easy access"
                                    icon={<IconCheck size={16} />}
                                />
                                <Stepper.Step
                                    label="Get Started"
                                    description="Click the extension icon to start using all features"
                                    icon={<IconRocket size={16} />}
                                />
                            </Stepper>
                        </Box>

                        <Box display={{ base: 'none', lg: 'block' }} w={256}>
                            <Paper
                                radius="md"
                                sx={(theme) => ({
                                    backgroundColor: theme.colors.gray[1],
                                    height: 256,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                })}
                            >
                                <img
                                    src="/extension-preview.png"
                                    alt="Chrome Extension Preview"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        borderRadius: 'inherit',
                                    }}
                                />
                            </Paper>
                        </Box>
                    </Group>
                </Card>

                {/* Features Card */}
                <Card radius="md">
                    <Title order={4} mb="lg">
                        Extension Features
                    </Title>
                    <Grid>
                        <Grid.Col md={6} lg={4}>
                            <Stack spacing="xs">
                                <Title order={5}>Real-time Analytics</Title>
                                <Text c="dimmed">
                                    Monitor your performance metrics in
                                    real-time directly from your browser
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col md={6} lg={4}>
                            <Stack spacing="xs">
                                <Title order={5}>Quick Actions</Title>
                                <Text c="dimmed">
                                    Access commonly used features with just one
                                    click
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col md={6} lg={4}>
                            <Stack spacing="xs">
                                <Title order={5}>Smart Notifications</Title>
                                <Text c="dimmed">
                                    Get instant alerts about important events
                                    and metrics
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col md={6} lg={4}>
                            <Stack spacing="xs">
                                <Title order={5}>Data Collection</Title>
                                <Text c="dimmed">
                                    Easily track and collect data from your
                                    connected platforms
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col md={6} lg={4}>
                            <Stack spacing="xs">
                                <Title order={5}>Dashboard Access</Title>
                                <Text c="dimmed">
                                    Quick access to your full dashboard and
                                    reports
                                </Text>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col md={6} lg={4}>
                            <Stack spacing="xs">
                                <Title order={5}>Integration Tools</Title>
                                <Text c="dimmed">
                                    Seamlessly integrate with your existing
                                    workflow
                                </Text>
                            </Stack>
                        </Grid.Col>
                    </Grid>
                </Card>
            </Stack>
        </Box>
    );
};

export default AppsExtensions;
