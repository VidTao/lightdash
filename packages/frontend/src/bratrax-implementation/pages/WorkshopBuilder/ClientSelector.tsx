import {
    Badge,
    Button,
    Group,
    Menu,
    Modal,
    Stack,
    TextInput,
} from '@mantine/core';
import { IconChevronDown, IconFolder, IconPlus } from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
import {
    useBratraxClients,
    useBratraxCreateClient,
} from '../../hooks/useBratraxClients';

type Props = {
    currentClient: string | null;
    onSelectClient: (name: string) => void;
};

const ClientSelector: FC<Props> = ({ currentClient, onSelectClient }) => {
    const [createOpened, setCreateOpened] = useState(false);
    const [newName, setNewName] = useState('');

    const { data: clientsData } = useBratraxClients();
    const createMutation = useBratraxCreateClient();

    const clients = clientsData?.clients ?? [];

    const handleCreate = useCallback(() => {
        if (!newName.trim()) return;
        createMutation.mutate(
            { name: newName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/^[^a-z]/, 'c') },
            {
                onSuccess: (result) => {
                    onSelectClient(result.name);
                    setCreateOpened(false);
                    setNewName('');
                },
            },
        );
    }, [newName, createMutation, onSelectClient]);

    return (
        <>
            <Menu shadow="md" width={240}>
                <Menu.Target>
                    <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        leftIcon={<IconFolder size={14} />}
                        rightIcon={<IconChevronDown size={12} />}
                    >
                        {currentClient ?? 'No client'}
                    </Button>
                </Menu.Target>

                <Menu.Dropdown>
                    <Menu.Item
                        icon={<IconPlus size={14} />}
                        onClick={() => setCreateOpened(true)}
                    >
                        Create New Client
                    </Menu.Item>

                    {clients.length > 0 && <Menu.Divider />}

                    {clients.map((c) => (
                        <Menu.Item
                            key={c.name}
                            onClick={() => onSelectClient(c.name)}
                        >
                            <Group spacing={6}>
                                <span>{c.name}</span>
                                {c.has_ontology && (
                                    <Badge
                                        size="xs"
                                        variant="dot"
                                        color="green"
                                    >
                                        ont
                                    </Badge>
                                )}
                                {c.has_sources && (
                                    <Badge size="xs" variant="dot" color="blue">
                                        src
                                    </Badge>
                                )}
                                {c.has_tracking_plan && (
                                    <Badge
                                        size="xs"
                                        variant="dot"
                                        color="violet"
                                    >
                                        tp
                                    </Badge>
                                )}
                            </Group>
                        </Menu.Item>
                    ))}
                </Menu.Dropdown>
            </Menu>

            <Modal
                opened={createOpened}
                onClose={() => {
                    setCreateOpened(false);
                    setNewName('');
                }}
                title="Create New Client"
                size="sm"
            >
                <Stack spacing="sm">
                    <TextInput
                        label="Client name"
                        placeholder="e.g. acme-store"
                        value={newName}
                        onChange={(e) => setNewName(e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                        }}
                    />
                    <Button
                        onClick={handleCreate}
                        loading={createMutation.isLoading}
                        disabled={!newName.trim()}
                    >
                        Create
                    </Button>
                </Stack>
            </Modal>
        </>
    );
};

export default ClientSelector;
