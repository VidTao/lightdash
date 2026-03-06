import {
    Alert,
    Button,
    Divider,
    Group,
    Modal,
    PasswordInput,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconKey } from '@tabler/icons-react';
import React, { useState } from 'react';

interface AppleSearchAdsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (
        clientId: string,
        teamId: string,
        keyId: string,
        privateKey: string,
    ) => Promise<void>;
    isLoading: boolean;
}

interface FormValues {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
}

const AppleSearchAdsModal: React.FC<AppleSearchAdsModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading,
}) => {
    const [authError, setAuthError] = useState<string | null>(null);

    const form = useForm<FormValues>({
        initialValues: {
            clientId: '',
            teamId: '',
            keyId: '',
            privateKey: '',
        },
        validate: {
            clientId: (value) =>
                value.length > 0 ? null : 'Client ID is required',
            teamId: (value) =>
                value.length > 0 ? null : 'Team ID is required',
            keyId: (value) =>
                value.length > 0 ? null : 'Key ID is required',
            privateKey: (value) => {
                if (value.length === 0) return 'Private key is required';
                if (!value.includes('BEGIN') || !value.includes('END'))
                    return 'Invalid PEM format';
                return null;
            },
        },
    });

    const handleSubmit = async (values: FormValues) => {
        try {
            setAuthError(null);
            await onSubmit(
                values.clientId,
                values.teamId,
                values.keyId,
                values.privateKey,
            );
            form.reset();
        } catch (error) {
            setAuthError(
                error instanceof Error
                    ? error.message
                    : 'Failed to connect. Please check your credentials.',
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
            size="lg"
            centered
            radius="md"
        >
            <Stack spacing="lg">
                <div style={{ textAlign: 'center' }}>
                    <img
                        src="/images/apple-search-ads-logo.png"
                        alt="Apple Search Ads Logo"
                        style={{ maxHeight: 40, marginBottom: 20 }}
                    />
                </div>

                <Title order={4} align="center">
                    Connect your Apple Search Ads account
                </Title>

                <Text align="center" color="dimmed" size="sm">
                    Enter your API credentials from Apple Search Ads Settings
                    &gt; API
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
                        <TextInput
                            label="Client ID"
                            placeholder="SEARCHADS.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            required
                            {...form.getInputProps('clientId')}
                        />

                        <TextInput
                            label="Team ID"
                            placeholder="Your Apple Developer Team ID"
                            required
                            {...form.getInputProps('teamId')}
                        />

                        <TextInput
                            label="Key ID"
                            placeholder="Key ID from Apple Search Ads UI"
                            required
                            {...form.getInputProps('keyId')}
                        />

                        <Textarea
                            label="Private Key (PEM)"
                            placeholder={"-----BEGIN EC PRIVATE KEY-----\n...\n-----END EC PRIVATE KEY-----"}
                            required
                            minRows={4}
                            {...form.getInputProps('privateKey')}
                        />

                        <Text size="xs" color="dimmed">
                            Generate credentials in Apple Search Ads → Settings
                            → API
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
                                Connect to Apple Search Ads
                            </Button>
                        </Group>
                    </Stack>
                </form>

                <Divider label="Secure Connection" labelPosition="center" />

                <Text size="xs" color="dimmed" align="center">
                    Your private key is used once to generate a signed token and
                    is not stored.
                </Text>
            </Stack>
        </Modal>
    );
};

export default AppleSearchAdsModal;
