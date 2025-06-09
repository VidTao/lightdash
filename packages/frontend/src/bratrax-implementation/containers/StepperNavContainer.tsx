import { Container, Group } from '@mantine/core';
import StepperButton from '../buttons/StepperButton';

interface StepperNavigationProps {
    onNext: () => void;
    onBack: () => void;
    canGoNext: boolean;
    canGoBack: boolean;
}

const StepperNavigation = ({
    onNext,
    onBack,
    canGoNext,
    canGoBack,
}: StepperNavigationProps) => {
    return (
        <Container size="xl" mt={48} mb={48}>
            <Group
                position="apart"
                sx={(theme) => ({
                    maxWidth: '800px',
                    margin: '0 auto',
                    padding: '0 16px',
                })}
            >
                <StepperButton
                    variant="secondary"
                    onClick={onBack}
                    disabled={!canGoBack}
                    leftIcon
                >
                    Back
                </StepperButton>
                <StepperButton
                    variant="primary"
                    onClick={onNext}
                    disabled={!canGoNext}
                    rightIcon
                >
                    Next
                </StepperButton>
            </Group>
        </Container>
    );
};

export default StepperNavigation;
