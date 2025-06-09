import { Stepper as MantineStepper } from '@mantine/core';

interface Step {
    title: string;
}

interface StepperProps {
    steps: Step[];
    currentStep: number;
}

const Stepper = ({ steps, currentStep }: StepperProps) => (
    <MantineStepper active={currentStep} breakpoint="sm">
        {steps.map((step, index) => (
            <MantineStepper.Step key={index} label={step.title} />
        ))}
    </MantineStepper>
);

export default Stepper;
