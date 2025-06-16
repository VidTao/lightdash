import {
    Box,
    Button,
    Divider,
    Group,
    Paper,
    Stack,
    Switch,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBrandSlack, IconMail } from '@tabler/icons-react';
import React from 'react';

interface FormValues {
    dailyReport: boolean;
    weeklyReport: boolean;
    monthlyReport: boolean;
    alertThreshold: boolean;
}

const Reports: React.FC = () => {
    const form = useForm<FormValues>({
        initialValues: {
            dailyReport: true,
            weeklyReport: true,
            monthlyReport: true,
            alertThreshold: true,
        },
    });

    const onSubmit = (values: FormValues) => {
        console.log('Form values:', values);
    };

    return (
        <Box p="xl">
            <Stack mb="xl">
                <Title order={2}>Reports</Title>
                <Text c="dimmed">
                    Configure your reporting preferences and notifications
                </Text>
            </Stack>

            <Stack spacing="lg">
                {/* Slack Integration */}
                <Paper p="md" radius="md" withBorder>
                    <Group position="apart" mb="md">
                        <Box>
                            <Group mb="xs">
                                <IconBrandSlack size={24} />
                                <Title order={4}>Slack Integration</Title>
                            </Group>
                            <Text c="dimmed">
                                Connect Slack to receive reports and
                                notifications
                            </Text>
                        </Box>
                        <Button leftIcon={<IconBrandSlack size={16} />}>
                            Connect Slack
                        </Button>
                    </Group>
                    <Text c="dimmed" size="sm">
                        Once connected, you'll be able to receive reports and
                        notifications directly in your Slack workspace.
                    </Text>
                </Paper>

                {/* Email Notifications */}
                <Paper p="md" radius="md" withBorder>
                    <Group mb="lg">
                        <IconMail size={24} />
                        <Title order={4}>Email Notifications</Title>
                    </Group>

                    <form onSubmit={form.onSubmit(onSubmit)}>
                        <Stack spacing="lg">
                            <Group position="apart" align="center">
                                <Box>
                                    <Text weight={500}>
                                        Daily Performance Report
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        Receive a daily summary of your store's
                                        performance
                                    </Text>
                                </Box>
                                <Switch
                                    {...form.getInputProps('dailyReport', {
                                        type: 'checkbox',
                                    })}
                                />
                            </Group>

                            <Divider />

                            <Group position="apart" align="center">
                                <Box>
                                    <Text weight={500}>
                                        Weekly Analytics Report
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        Get detailed weekly analytics and trends
                                    </Text>
                                </Box>
                                <Switch
                                    {...form.getInputProps('weeklyReport', {
                                        type: 'checkbox',
                                    })}
                                />
                            </Group>

                            <Divider />

                            <Group position="apart" align="center">
                                <Box>
                                    <Text weight={500}>
                                        Monthly Business Review
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        Monthly comprehensive business
                                        performance report
                                    </Text>
                                </Box>
                                <Switch
                                    {...form.getInputProps('monthlyReport', {
                                        type: 'checkbox',
                                    })}
                                />
                            </Group>

                            <Divider />

                            <Group position="apart" align="center">
                                <Box>
                                    <Text weight={500}>Performance Alerts</Text>
                                    <Text size="sm" c="dimmed">
                                        Get notified when metrics exceed defined
                                        thresholds
                                    </Text>
                                </Box>
                                <Switch
                                    {...form.getInputProps('alertThreshold', {
                                        type: 'checkbox',
                                    })}
                                />
                            </Group>

                            <Box mt="lg">
                                <Button type="submit">Save Preferences</Button>
                            </Box>
                        </Stack>
                    </form>
                </Paper>
            </Stack>
        </Box>
    );
};

export default Reports;
