import {
    Alert,
    Button,
    Divider,
    Group,
    Modal,
    PasswordInput,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconKey } from '@tabler/icons-react';
import React, { useState } from 'react';

interface IterableApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (apiKey: string) => Promise<void>;
    isLoading: boolean;
}

interface FormValues {
    apiKey: string;
}

const IterableApiKeyModal: React.FC<IterableApiKeyModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}) => {
    const [authError, setAuthError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        initialValues: {
            apiKey: '',
        },
        validate: {
            apiKey: (value) =>
                value.length > 0 ? null : 'API key is required',
        },
    });

    const handleSubmit = async (values: FormValues) => {
        try {
            setAuthError(null);
            await onSubmit(values.apiKey);
            form.reset();
        } catch (error) {
            setAuthError(
                error instanceof Error
                    ? error.message
                    : 'Failed to connect. Please check your API key.',
            );
        }
    };

    const handleCancel = () => {
        setAuthError(null);
        form.reset();
        onClose();
    };

    return (
        <Modal
            opened={isOpen}
            onClose={handleCancel}
            title="Connect to Iterable"
            size="lg"
            centered
            radius="md"
            styles={(theme) => ({
                title: {
                    fontWeight: 600,
                    fontSize: theme.fontSizes.xl,
                },
            })}
        >
            <Stack spacing="lg">
                <div style={{ textAlign: 'center' }}>
                    <img
                        src="/images/iterable-logo.webp"
                        alt="Iterable Logo"
                        style={{ maxHeight: 40, marginBottom: 20 }}
                    />
                </div>

                <Title order={4} align="center">
                    Connect your Iterable account
                </Title>

                <Text align="center" color="dimmed" size="sm">
                    Enter your Iterable API key to connect and access your email
                    marketing data
                </Text>

                {authError && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Connection Error"
                        color="red"
                        variant="filled"
                        onClose={() => setAuthError(null)}
                        withCloseButton
                    >
                        {authError}
                    </Alert>
                )}

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <Stack spacing="md">
                        <PasswordInput
                            label="API Key"
                            placeholder="Enter your Iterable API key"
                            icon={<IconKey size={16} />}
                            required
                            {...form.getInputProps('apiKey')}
                        />

                        <Text size="xs" color="dimmed">
                            Find your API key in Iterable → Settings → API Keys
                        </Text>

                        <Group spacing="sm" grow mt="xl">
                            <Button
                                variant="default"
                                onClick={handleCancel}
                                radius="sm"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                loading={isLoading}
                                radius="sm"
                                sx={(theme) => ({
                                    backgroundColor: 'rgb(114, 98, 255)',
                                    '&:hover': {
                                        backgroundColor: 'rgb(103, 88, 230)',
                                    },
                                })}
                            >
                                Connect to Iterable
                            </Button>
                        </Group>
                    </Stack>
                </form>

                <Divider label="Secure Connection" labelPosition="center" />

                <Text size="xs" color="dimmed" align="center">
                    Your API key is securely stored and used only to access your
                    Iterable data.
                </Text>
            </Stack>
        </Modal>
    );
};

export default IterableApiKeyModal;
