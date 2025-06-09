import { Badge, Group, Paper, Title } from '@mantine/core';

const EventsListCard = ({
    title,
    events,
}: {
    title: string;
    events: string[];
}) => {
    return (
        <Paper shadow="sm" p="lg" withBorder>
            <Title order={3} mb="md">
                {title}
            </Title>
            <Group spacing="xs">
                {events.map((event, index) => (
                    <Badge key={index} variant="outline" radius="xl">
                        {event}
                    </Badge>
                ))}
            </Group>
        </Paper>
    );
};

export default EventsListCard;
