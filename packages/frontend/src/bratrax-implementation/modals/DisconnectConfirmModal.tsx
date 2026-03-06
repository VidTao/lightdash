import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import React from 'react';

interface DisconnectConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    platformName: string;
    isLoading: boolean;
}

const DisconnectConfirmModal: React.FC<DisconnectConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    platformName,
    isLoading,
}) => {
    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            size="sm"
            centered
            radius="md"
        >
            <Stack spacing="lg" align="center">
                <IconAlertTriangle size={48} color="red" />

                <Text weight={600} size="lg" align="center">
                    Disconnect {platformName}?
                </Text>

                <Text size="sm" color="dimmed" align="center">
                    Are you sure you want to disconnect {platformName}? This
                    will remove all stored credentials and connection data.
                </Text>

                <Group spacing="sm" grow w="100%">
                    <Button
                        variant="default"
                        onClick={onClose}
                        radius="sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        color="red"
                        onClick={onConfirm}
                        loading={isLoading}
                        radius="sm"
                    >
                        Disconnect
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default DisconnectConfirmModal;
