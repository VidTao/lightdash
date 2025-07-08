import {
    Box,
    Group,
    Paper,
    Stack,
    Switch,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import React, { useState } from 'react';
import { DeliveryEvent } from '../types';

interface DeliveryOverviewProps {
    title: string;
    description: string;
    data: DeliveryEvent[];
}

const DeliveryOverview: React.FC<DeliveryOverviewProps> = ({
    title,
    description,
    data,
}) => {
    const [useUtcTimezone, setUseUtcTimezone] = useState(false);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
        null,
        null,
    ]);

    const rows = data.map((item) => (
        <tr key={item.event}>
            <td>{item.event}</td>
            <td>{item.totalEventsSent}</td>
            <td>{item.eventsWithMatchedIds}</td>
            <td>{item.errors}</td>
            <td>{item.latestEventTimestamp}</td>
        </tr>
    ));

    return (
        <Box maw={1024}>
            <Stack mb="xl">
                <Title order={5}>Delivery Overview</Title>
                <Text c="dimmed">{description}</Text>
            </Stack>

            <Group position="apart" mb="lg">
                <Group>
                    <Text>Use UTC timezone</Text>
                    <Text size="sm" c="dimmed">
                        (displayed only to Triple Whale users)
                    </Text>
                    <Switch
                        checked={useUtcTimezone}
                        onChange={(event) =>
                            setUseUtcTimezone(event.currentTarget.checked)
                        }
                    />
                </Group>
                <DatePickerInput
                    type="range"
                    label="Pick dates range"
                    value={dateRange}
                    onChange={setDateRange}
                    w={300}
                />
            </Group>

            <Stack mb="xl">
                <Title order={5}>Event Delivery Summary</Title>
                <Paper withBorder>
                    <Table withBorder striped>
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Total Events Sent</th>
                                <th>Events with Matched Event IDs</th>
                                <th>Errors</th>
                                <th>Latest Event Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>{rows}</tbody>
                    </Table>
                </Paper>
            </Stack>
        </Box>
    );
};

export default DeliveryOverview;
