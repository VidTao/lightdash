import { Box, Text, Title } from '@mantine/core';

interface StandardEventDescriptionProps {
    title: string;
    description: string;
}

const EventDescription = ({
    title,
    description,
}: StandardEventDescriptionProps) => {
    return (
        <Box mb="xl">
            <Title order={2}>{title}</Title>
            <Text color="dimmed" mt="xs">
                {description}
            </Text>
        </Box>
    );
};

export default EventDescription;
