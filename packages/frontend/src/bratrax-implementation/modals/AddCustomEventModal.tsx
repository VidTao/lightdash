import {
    Button,
    Group,
    Modal,
    MultiSelect,
    Stack,
    TextInput,
    Textarea,
} from '@mantine/core';
import { useForm, zodResolver } from '@mantine/form';
import { z } from 'zod';
import { Property } from '../tracking-plan/types';

interface CustomEventFormData {
    name: string;
    description: string;
    properties: string[];
}

interface AddCustomEventModalProps {
    properties: Property[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: CustomEventFormData) => void;
}

const schema = z.object({
    name: z
        .string()
        .min(1, 'Event name is required')
        .regex(
            /^[a-zA-Z0-9_]+$/,
            'Only alphanumeric characters and underscores are allowed',
        ),
    description: z.string().min(1, 'Description is required'),
    properties: z
        .array(z.string())
        .min(1, 'Please select at least one property'),
});

const AddCustomEventModal = ({
    isOpen,
    onClose,
    onSubmit,
    properties,
}: AddCustomEventModalProps) => {
    const form = useForm({
        initialValues: {
            name: '',
            description: '',
            properties: [] as string[],
        },
        validate: zodResolver(schema),
    });

    const handleSubmit = (values: CustomEventFormData) => {
        onSubmit(values);
        form.reset();
        onClose();
    };

    const propertyOptions = properties.map((prop) => ({
        label: prop.name,
        value: prop.id,
        description: prop.description,
    }));

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title="Add Custom Event"
            size="lg"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="md">
                    <TextInput
                        label="Event Name"
                        placeholder="Enter event name"
                        {...form.getInputProps('name')}
                    />

                    <Textarea
                        label="Description"
                        placeholder="Describe the purpose of this event"
                        minRows={4}
                        {...form.getInputProps('description')}
                    />

                    <MultiSelect
                        label="Properties"
                        placeholder="Select properties"
                        data={propertyOptions}
                        {...form.getInputProps('properties')}
                    />

                    <Group position="right" mt="md">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Event</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default AddCustomEventModal;
