import {
    Button,
    Group,
    Modal,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { IconWebhook } from '@tabler/icons-react';
import { useState } from 'react';

interface AddWebhookModalProps {
    opened: boolean;
    onClose: () => void;
    onCreated: (source: string, platformName: string) => void;
    existingSources: string[];
}

const AddWebhookModal = ({
    opened,
    onClose,
    onCreated,
    existingSources,
}: AddWebhookModalProps) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const sourceKey = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    const handleCreate = () => {
        if (!name.trim()) {
            setError('Name is required');
            return;
        }
        if (!sourceKey) {
            setError('Name must contain at least one letter or number');
            return;
        }
        if (existingSources.includes(sourceKey)) {
            setError(`A webhook source named "${sourceKey}" already exists`);
            return;
        }
        onCreated(sourceKey, name.trim());
        setName('');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setName('');
        setError('');
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={handleClose}
            title={
                <Group spacing="xs">
                    <IconWebhook size={20} />
                    <Title order={4}>Add Webhook Source</Title>
                </Group>
            }
            size="md"
        >
            <Stack spacing="md">
                <Text size="sm" color="dimmed">
                    Create a new webhook endpoint. After creating, you&apos;ll
                    get a URL and auth key to configure in your external
                    platform.
                </Text>

                <TextInput
                    label="Source Name"
                    placeholder="e.g. My CRM, HubSpot, Custom App"
                    value={name}
                    onChange={(e) => {
                        setName(e.currentTarget.value);
                        setError('');
                    }}
                    error={error}
                    description={
                        sourceKey
                            ? `Webhook key: ${sourceKey}`
                            : 'Enter a name for your webhook source'
                    }
                />

                {sourceKey && (
                    <Text size="xs" color="dimmed">
                        Endpoint will be:{' '}
                        <Text span ff="monospace" size="xs" weight={600}>
                            https://api.bratrax.com/{sourceKey}/track
                        </Text>
                    </Text>
                )}

                <Group position="right" mt="md">
                    <Button variant="subtle" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!sourceKey}>
                        Create Webhook
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default AddWebhookModal;
