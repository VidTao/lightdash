import {
    Button,
    Grid,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useState } from 'react';
import Skeleton from '../loading/Skeleton';
import { apiService } from '../services/api';

interface DomainVerificatorProps {
    onValidated: (isValid: boolean) => void;
    selectedDomain: string;
    setSelectedSubdomain: (subdomain: string) => void;
}

const DomainVerificator = ({
    onValidated,
    selectedDomain,
    setSelectedSubdomain,
}: DomainVerificatorProps) => {
    const [isLoading, setIsLoading] = useState(false);

    // In a real app, these would likely come from props or an API
    const cnameRecord = {
        host: `b.${selectedDomain}`,
        value: 'https://storage.googleapis.com/bratrax-analytics-js/browser-umd.js',
        type: 'CNAME',
    };

    const handleVerify = async () => {
        try {
            setIsLoading(true);
            const response = await apiService.verifyDomain(
                cnameRecord.host,
                cnameRecord.value,
            );
            setSelectedSubdomain(cnameRecord.host);
            onValidated(response.is_valid);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Stack spacing="lg" justify="space-between" h="100%">
            {selectedDomain ? (
                <>
                    <Stack spacing="lg">
                        <Title order={3}>Domain Verification</Title>
                        <Text color="dimmed">
                            Go to your domain provider and add the following
                            CNAME record, verify after adding it:
                        </Text>

                        <Paper withBorder p="md" bg="gray.0">
                            <SimpleGrid cols={3}>
                                <Stack spacing="xs">
                                    <Text size="sm" color="dimmed">
                                        Host
                                    </Text>
                                    <Text ff="monospace">
                                        {cnameRecord.host}
                                    </Text>
                                </Stack>
                                <Stack spacing="xs">
                                    <Text size="sm" color="dimmed">
                                        Type
                                    </Text>
                                    <Text ff="monospace">
                                        {cnameRecord.type}
                                    </Text>
                                </Stack>
                                <Stack spacing="xs">
                                    <Text size="sm" color="dimmed">
                                        Points to
                                    </Text>
                                    <Text
                                        ff="monospace"
                                        sx={{ wordBreak: 'break-word' }}
                                    >
                                        {cnameRecord.value}
                                    </Text>
                                </Stack>
                            </SimpleGrid>
                        </Paper>
                    </Stack>
                    <Group position="right">
                        <Button
                            onClick={handleVerify}
                            disabled={isLoading}
                            loading={isLoading}
                        >
                            Verify Domain
                        </Button>
                    </Group>
                </>
            ) : (
                <Skeleton count={5} height={25} />
            )}
        </Stack>
    );
};

export default DomainVerificator;
