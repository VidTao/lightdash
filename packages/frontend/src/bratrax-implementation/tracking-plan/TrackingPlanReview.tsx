import { Container, Grid, Paper, Stack, Text, Title, Select, Box } from '@mantine/core';
import React, { useState, useMemo, useEffect } from 'react';
import { notificationService } from '../services/notification.service';
import DomainVerificator from './DomainVerificator';
import EnterDomain from './EnterDomain';
import EventsListCard from './EventsListCard';
import ScriptInstallation from './ScriptInstallation';
import { StandardEvent } from './types';
import { WriteKey } from '../hooks/useWriteKeys';

interface TrackingPlanReviewProps {
    events: StandardEvent[];
    selectedPlatform: string | null;
    writeKey: string | null;
    writeKeys: WriteKey[];
}

const CARD_HEIGHT = 200;

const TrackingPlanReview = ({ events, selectedPlatform, writeKey, writeKeys }: TrackingPlanReviewProps) => {
    const [isDomainValid, setIsDomainValid] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedSubdomain, setSelectedSubdomain] = useState('');
    const [selectedWriteKeyId, setSelectedWriteKeyId] = useState<string>('');

    // Set first write key as default when writeKeys load
    useEffect(() => {
        if (writeKeys.length > 0 && !selectedWriteKeyId) {
            setSelectedWriteKeyId(writeKeys[0].writeKeyId.toString());
        }
    }, [writeKeys, selectedWriteKeyId]);

    // Get the actual write key value to use in the script
    const currentWriteKey = useMemo(() => {
        if (selectedWriteKeyId) {
            const selected = writeKeys.find(key => key.writeKeyId.toString() === selectedWriteKeyId);
            return selected?.writeKey || null;
        }
        return writeKey; // Fallback to the default write key
    }, [selectedWriteKeyId, writeKeys, writeKey]);

    const onValidated = (isValid: boolean) => {
        setIsDomainValid(true);
        console.log('isValid', isValid);
        if (isValid)
            notificationService.showSuccessNotification(
                'Verification successful',
                'Domain is valid, you can proceed to the next step!',
            );
        else
            notificationService.showErrorNotification(
                'Verification failed',
                'Domain is not valid, please check your CNAME record!',
            );
    };

    return (
        <Container size="lg" my="xl">
            <Stack align="center" spacing="sm">
                <Title order={1}>Implementation Guide</Title>
                <Text size="lg" color="dimmed">
                    Here's everything you need to implement tracking in your
                    Shopify store
                </Text>
            </Stack>
            
            <Stack spacing="xl" mt="xl">
                {/* Write Key Selector - only show if multiple write keys exist */}
                {writeKeys.length > 1 && (
                    <Box>
                        <Paper shadow="sm" p="lg" withBorder>
                            <Stack spacing="md">
                                <div>
                                    <Text size="lg" weight={600}>
                                        Select Write Key
                                    </Text>
                                    <Text size="sm" color="dimmed">
                                        Choose which write key to use for tracking (multiple keys found for {selectedPlatform})
                                    </Text>
                                </div>
                                <Select
                                    placeholder="Select store"
                                    label="Store"
                                    data={writeKeys.map(key => ({
                                        value: key.writeKeyId.toString(),
                                        label: key.storeName || key.writeKey
                                    }))}
                                    value={selectedWriteKeyId}
                                    onChange={(value) => setSelectedWriteKeyId(value || '')}
                                    style={{ minWidth: 300 }}
                                />
                            </Stack>
                        </Paper>
                    </Box>
                )}
                
                <EventsListCard
                    title="Tracking Events"
                    events={events.map((event) => event.name)}
                />
                
                <Grid>
                    <Grid.Col md={6}>
                        <Paper
                            shadow="sm"
                            p="lg"
                            withBorder
                            sx={{ minHeight: CARD_HEIGHT }}
                        >
                            <EnterDomain onDomainSelected={setSelectedDomain} />
                        </Paper>
                    </Grid.Col>
                    <Grid.Col md={6}>
                        <Paper
                            shadow="sm"
                            p="lg"
                            withBorder
                            sx={{ minHeight: CARD_HEIGHT }}
                        >
                            <DomainVerificator
                                setSelectedSubdomain={setSelectedSubdomain}
                                onValidated={onValidated}
                                selectedDomain={selectedDomain}
                            />
                        </Paper>
                    </Grid.Col>
                </Grid>
            
                {isDomainValid && (
                    <ScriptInstallation
                        events={events.map((event) => event.name)}
                        selectedSubdomain={selectedSubdomain}
                        writeKey={currentWriteKey}
                    />
                )}
            </Stack>
        </Container>
    );
};

export default TrackingPlanReview;
