import { Container, Grid } from '@mantine/core';
import { useEffect, useState, useMemo } from 'react';
import StepperNavigationButtons from '../containers/StepperNavContainer';
import { useProperties } from '../hooks/useProperties';
import { useStandardEvents } from '../hooks/useStandardEvents';
import { useWriteKeys } from '../hooks/useWriteKeys';
import Stepper from '../progres/Stepper';
import EventsList from './EventsList';
import PlatformSelect from './PlatformSelect';
// import LoadingSpinner from '../components/loading/LoadingSpinner';
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
    
    // Updated steps - removed "Connect streams"
    const steps = [
        { title: 'Select Platform' },
        { title: 'Define events' },
        { title: 'Review & generate' },
    ];

    // Default events that should be selected automatically
    const defaultSelectedEventNames = [
        'product_added_to_cart',
        'checkout_started', 
        'checkout_completed',
        'page_viewed'
    ];

    // Get write keys for the selected platform
    const { writeKeys, isLoading: writeKeysLoading } = useWriteKeys({ 
        source: selectedPlatform || '' 
    });

    // Check if the selected platform has write keys
    const hasWriteKeysForPlatform = useMemo(() => {
        if (!selectedPlatform) return false;
        return writeKeys.some(key => key.platform.toLowerCase() === selectedPlatform.toLowerCase());
    }, [writeKeys, selectedPlatform]);

    // Get the write key for the selected platform
    const selectedWriteKey = useMemo(() => {
        if (!selectedPlatform || !writeKeys.length) return null;
        return writeKeys.find(key => key.platform.toLowerCase() === selectedPlatform.toLowerCase())?.writeKey || null;
    }, [writeKeys, selectedPlatform]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
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

    // Auto-select default events when standardEvents are loaded
    useEffect(() => {
        if (standardEvents && standardEvents.length > 0 && selectedEvents.length === 0) {
            const defaultEvents = standardEvents.filter(event => 
                defaultSelectedEventNames.includes(event.name)
            );
            
            // Add events with all properties marked as selected
            const eventsWithSelectedProperties = defaultEvents.map(event => ({
                ...event,
                properties: event.properties.map((prop: any) => ({
                    ...prop,
                    isSelected: true,
                })),
            }));
            
            setSelectedEvents(eventsWithSelectedProperties);
        }
    }, [standardEvents]); // Only depend on standardEvents, not selectedEvents to avoid infinite loop

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

    // Updated canGoNext logic
    const canGoNext = useMemo(() => {
        if (currentStep === 0) {
            // For step 0, user can only proceed if platform is selected AND has write keys
            return !!selectedPlatform && hasWriteKeysForPlatform && !writeKeysLoading;
        }
        // For other steps, keep existing logic or add new conditions as needed
        return currentStep < steps.length - 1;
    }, [currentStep, selectedPlatform, hasWriteKeysForPlatform, writeKeysLoading, steps.length]);

    return (
        <Container size="xl" p="xl">
            <Stepper steps={steps} currentStep={currentStep} />
            {currentStep === 0 && (
                <PlatformSelect
                    selectedPlatform={selectedPlatform}
                    onPlatformSelect={setSelectedPlatform}
                />
            )}
            {currentStep === 1 && (
                <EventsList
                    events={standardEvents}
                    selectedEvents={selectedEvents}
                    onEventSelect={handleEventSelect}
                    onPropertySelect={handlePropertySelect}
                />
            )}
            {currentStep === 2 && (
                <TrackingPlanReview 
                    events={selectedEvents} 
                    selectedPlatform={selectedPlatform}
                    writeKey={selectedWriteKey}
                    writeKeys={writeKeys}
                />
            )}
            <StepperNavigationButtons
                onNext={handleNext}
                onBack={handleBack}
                canGoNext={canGoNext}
                canGoBack={currentStep > 0}
            />
        </Container>
    );
};

export default TrackingPlan;
