import { Container, Grid } from '@mantine/core';
import { useEffect, useState } from 'react';
import StepperNavigationButtons from '../containers/StepperNavContainer';
import { useProperties } from '../hooks/useProperties';
import { useStandardEvents } from '../hooks/useStandardEvents';
import Stepper from '../progres/Stepper';
import EventsList from './EventsList';
import PlatformSelect from './PlatformSelect';
// import LoadingSpinner from '../components/loading/LoadingSpinner';
import Dashboard from '../pages/Dashboard';
import CustomEventsCreator from './CustomEvents';
import TrackingPlanReview from './TrackingPlanReview';
import { StandardEvent } from './types';

const TrackingPlan = () => {
    const [selectedPlatform, setSelectedPlatform] = useState<string | null>(
        null,
    );
    const {
        events: standardEvents,
        setEvents,
        loading,
    } = useStandardEvents(selectedPlatform);
    const [selectedEvents, setSelectedEvents] = useState<StandardEvent[]>([]);
    const { properties } = useProperties();
    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
        { title: 'Select Platform' },
        { title: 'Connect streams' },
        { title: 'Define events' },
        { title: 'Review & generate' },
    ];
    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };
    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    useEffect(() => {
        console.log(selectedEvents);
    }, [selectedEvents]);

    const handleEventSelect = (eventId: string) => {
        const event = standardEvents?.find((e) => e.id === eventId);
        if (!event) return;

        setSelectedEvents((prev) => {
            const isCurrentlySelected = prev.some((e) => e.id === eventId);

            if (isCurrentlySelected) {
                // Remove event
                return prev.filter((e) => e.id !== eventId);
            } else {
                // Add event with all properties marked as selected
                const eventWithSelectedProperties = {
                    ...event,
                    properties: event.properties.map((prop: any) => ({
                        ...prop,
                        isSelected: true, // Set all properties to selected when adding event
                    })),
                };
                return [...prev, eventWithSelectedProperties];
            }
        });
    };

    const handlePropertySelect = (eventId: string, propertyId: string) => {
        const event = standardEvents?.find((e) => e.id === eventId);
        if (!event) return;

        setSelectedEvents((prev) => {
            const existingEvent = prev.find((e) => e.id === eventId);

            // If event doesn't exist in selected events, add it with only this property selected
            if (!existingEvent) {
                const newEvent = {
                    ...event,
                    properties: event.properties.map((p: any) => ({
                        ...p,
                        isSelected: p.id === propertyId, // Only select the clicked property
                    })),
                };
                return [...prev, newEvent];
            }

            // Update existing event
            const updatedEvents = prev.map((e) => {
                if (e.id === eventId) {
                    const updatedProperties = e.properties.map((p) => ({
                        ...p,
                        isSelected:
                            p.id === propertyId ? !p.isSelected : p.isSelected,
                    }));

                    // Check if any properties are selected after update
                    const hasSelectedProperties = updatedProperties.some(
                        (p) => p.isSelected,
                    );

                    // If no properties are selected, return null to remove the event
                    if (!hasSelectedProperties) {
                        return null;
                    }

                    return {
                        ...e,
                        properties: updatedProperties,
                    };
                }
                return e;
            });

            // Filter out null values and return the updated array
            return updatedEvents.filter(
                (event): event is StandardEvent => event !== null,
            );
        });
    };
    const handleEventCreated = (event: any) => {
        setEvents((prev) => [event, ...prev]);
    };

    return (
        <Container size="xl" p="xl">
            <Stepper steps={steps} currentStep={currentStep} />
            {currentStep === 0 && (
                <PlatformSelect
                    selectedPlatform={selectedPlatform}
                    onPlatformSelect={setSelectedPlatform}
                />
            )}
            {currentStep === 1 && <Dashboard />}
            {currentStep === 2 && (
                <Grid gutter="lg">
                    <Grid.Col span={6}>
                        <EventsList
                            events={standardEvents}
                            selectedEvents={selectedEvents}
                            onEventSelect={handleEventSelect}
                            onPropertySelect={handlePropertySelect}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <CustomEventsCreator
                            onEventCreated={handleEventCreated}
                            properties={properties}
                        />
                    </Grid.Col>
                </Grid>
            )}
            {currentStep === 3 && (
                <TrackingPlanReview events={selectedEvents} />
            )}
            <StepperNavigationButtons
                onNext={handleNext}
                onBack={handleBack}
                canGoNext={!!selectedPlatform}
                canGoBack={currentStep > 0}
            />
        </Container>
    );
};

export default TrackingPlan;
