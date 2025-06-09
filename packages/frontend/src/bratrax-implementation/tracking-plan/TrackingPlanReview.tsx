import { Container, Grid, Paper, Stack, Text, Title } from '@mantine/core';
import React, { useState } from 'react';
import { notificationService } from '../services/notification.service';
import DomainVerificator from './DomainVerificator';
import EnterDomain from './EnterDomain';
import EventsListCard from './EventsListCard';
import ScriptInstallation from './ScriptInstallation';
import { StandardEvent } from './types';

interface TrackingPlanReviewProps {
    events: StandardEvent[];
}

const CARD_HEIGHT = 200; // You can adjust this value based on your needs

const TrackingPlanReview = ({ events }: TrackingPlanReviewProps) => {
    const [isDomainValid, setIsDomainValid] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState('');
    const [selectedSubdomain, setSelectedSubdomain] = useState('');

    const onValidated = (isValid: boolean) => {
        setIsDomainValid(true); //ovdje promijeniti
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
                    />
                )}
            </Stack>
        </Container>
    );
};

export default TrackingPlanReview;
