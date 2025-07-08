import {
    Button,
    Group,
    Modal,
    Select,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconMail, IconUser } from '@tabler/icons-react';
import React, { useState } from 'react';
import { apiService } from '../services/api';

interface InviteUserModalProps {
    opened: boolean;
    onClose: () => void;
    onSubmit: (values: InviteUserData) => Promise<void>;
}

interface InviteUserData {
    email: string;
    name?: string;
    role: 'admin' | 'user';
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
    opened,
    onClose,
    onSubmit,
}) => {
    const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(
        null,
    );
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        initialValues: {
            email: '',
            name: '',
            role: 'user' as const,
        },
        validate: {
            email: (value) =>
                /^\S+@\S+$/.test(value) ? null : 'Please enter a valid email',
            role: (value) => (value ? null : 'Please select a role'),
        },
    });

    const checkEmail = async () => {
        const email = form.values.email;

        if (!email) {
            notifications.show({
                color: 'red',
                message: 'Please enter an email',
            });
            return;
        }

        try {
            setIsCheckingEmail(true);
            const response = await apiService.checkEmailAvailability(email);
            setIsEmailAvailable(response.isAvailable);

            if (response.isAvailable) {
                notifications.show({
                    color: 'green',
                    message: 'Email is available',
                });
            } else {
                notifications.show({
                    color: 'red',
                    message: 'Email is already in use',
                });
            }
        } catch (error) {
            notifications.show({
                color: 'red',
                message: 'Failed to check email availability',
            });
            setIsEmailAvailable(false);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleSubmit = async (values: typeof form.values) => {
        if (!isEmailAvailable) {
            notifications.show({
                color: 'red',
                message: 'Please verify email availability first',
            });
            return;
        }

        try {
            setIsLoading(true);
            await onSubmit(values);
            form.reset();
            setIsEmailAvailable(null);
            onClose();
        } catch (error) {
            notifications.show({
                color: 'red',
                message: 'Please check your input and try again',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Invite Team Member"
            size="md"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="md">
                    <Stack spacing={0}>
                        <Group spacing="xs" grow>
                            <TextInput
                                required
                                label="Email"
                                placeholder="Enter email address"
                                icon={<IconMail size={16} />}
                                {...form.getInputProps('email')}
                                onChange={(event) => {
                                    form.setFieldValue(
                                        'email',
                                        event.currentTarget.value,
                                    );
                                    setIsEmailAvailable(null);
                                }}
                                rightSection={
                                    <Button
                                        compact
                                        variant="light"
                                        onClick={checkEmail}
                                        loading={isCheckingEmail}
                                    >
                                        Check
                                    </Button>
                                }
                            />
                        </Group>
                        {isEmailAvailable !== null && (
                            <Text
                                size="sm"
                                mt="xs"
                                c={isEmailAvailable ? 'green' : 'red'}
                            >
                                {isEmailAvailable
                                    ? '✓ Email is available'
                                    : '✗ Email is not available'}
                            </Text>
                        )}
                    </Stack>

                    <TextInput
                        label="Name"
                        placeholder="Enter name (optional)"
                        icon={<IconUser size={16} />}
                        {...form.getInputProps('name')}
                    />

                    <Select
                        label="Role"
                        required
                        placeholder="Select a role"
                        data={[
                            { value: 'user', label: 'User' },
                            { value: 'admin', label: 'Admin' },
                        ]}
                        {...form.getInputProps('role')}
                    />

                    <Group position="right" mt="xl">
                        <Button variant="light" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isLoading}
                            disabled={!isEmailAvailable}
                        >
                            Invite
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default InviteUserModal;
