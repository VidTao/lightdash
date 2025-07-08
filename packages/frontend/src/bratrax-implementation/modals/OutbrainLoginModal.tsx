import {
    Alert,
    Button,
    Divider,
    Group,
    Modal,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconLock, IconMail } from '@tabler/icons-react';
import React, { useState } from 'react';

interface OutbrainLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (encodedAuth: string) => Promise<void>;
    isLoading: boolean;
}

interface FormValues {
    username: string;
    password: string;
}

const OutbrainLoginModal: React.FC<OutbrainLoginModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}) => {
    const [authError, setAuthError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        initialValues: {
            username: '',
            password: '',
        },
        validate: {
            username: (value) =>
                /^\S+@\S+$/.test(value) ? null : 'Invalid email address',
            password: (value) =>
                value.length > 0 ? null : 'Password is required',
        },
    });

    const handleSubmit = async (values: FormValues) => {
        try {
            setAuthError(null);
            const authString = `${values.username}:${values.password}`;
            const encodedAuth = btoa(authString);
            await onSubmit(encodedAuth);
            form.reset();
        } catch (error) {
            console.error('Validation failed:', error);
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
            title="Connect to Outbrain"
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
                        src="/images/outbrain-logo.png"
                        alt="Outbrain Logo"
                        style={{ maxHeight: 40, marginBottom: 20 }}
                    />
                </div>

                <Title order={4} align="center">
                    Sign in to your Outbrain account
                </Title>

                <Text align="center" color="dimmed" size="sm">
                    Enter your Outbrain credentials to connect and access your
                    campaign data
                </Text>

                {authError && (
                    <Alert
                        icon={<IconAlertCircle size={16} />}
                        title="Authentication Error"
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
                        <TextInput
                            label="Email Address"
                            placeholder="Enter your email"
                            icon={<IconMail size={16} />}
                            required
                            {...form.getInputProps('username')}
                        />

                        <PasswordInput
                            label="Password"
                            placeholder="Enter your password"
                            icon={<IconLock size={16} />}
                            required
                            {...form.getInputProps('password')}
                        />

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
                                Connect to Outbrain
                            </Button>
                        </Group>
                    </Stack>
                </form>

                <Divider label="Secure Connection" labelPosition="center" />

                <Text size="xs" color="dimmed" align="center">
                    Your credentials are securely used for authentication only
                    and are not stored. This connection will allow access to
                    your Outbrain campaign data.
                </Text>

                <Text
                    component="a"
                    href="https://www.outbrain.com/help/advertisers/"
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    align="center"
                    sx={(theme) => ({
                        color: 'rgb(114, 98, 255)',
                        '&:hover': {
                            textDecoration: 'underline',
                        },
                    })}
                >
                    Need help with your Outbrain account?
                </Text>
            </Stack>
        </Modal>
    );
};

export default OutbrainLoginModal;
