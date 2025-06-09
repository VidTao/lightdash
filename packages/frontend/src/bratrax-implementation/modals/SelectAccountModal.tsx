import { Button, Group, Modal, Stack } from '@mantine/core';
import { useState } from 'react';
import { AdPlatformAccountInfo } from '../models/interfaces';
import AccountsSelect from '../selects/AccountsSelect';

interface Props {
    modalTitle: string;
    isModalOpen: boolean;
    isLoading: boolean;
    handleOk: (selectedAccounts: AdPlatformAccountInfo[]) => void;
    handleCancel: () => void;
    accountsData: any[]; // We'll need to adjust this type based on your AccountsSelect component
}

const SelectAccountModal = ({
    isLoading,
    isModalOpen,
    handleOk,
    handleCancel,
    accountsData,
    modalTitle,
}: Props) => {
    const [selectedAccounts, setSelectedAccounts] = useState<
        AdPlatformAccountInfo[]
    >([]);

    return (
        <Modal
            opened={isModalOpen}
            onClose={handleCancel}
            title={modalTitle}
            size="lg"
            radius="md"
            centered
            styles={(theme) => ({
                header: {
                    marginBottom: theme.spacing.md,
                },
                title: {
                    fontWeight: 600,
                    fontSize: theme.fontSizes.xl,
                },
            })}
        >
            <Stack spacing="lg">
                <AccountsSelect
                    data={accountsData}
                    onSelectedAccountsChange={setSelectedAccounts}
                />

                <Group position="right" spacing="sm">
                    <Button
                        variant="default"
                        onClick={handleCancel}
                        radius="sm"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => handleOk(selectedAccounts)}
                        loading={isLoading}
                        radius="sm"
                        sx={(theme) => ({
                            backgroundColor: 'rgb(114, 98, 255)',
                            '&:hover': {
                                backgroundColor: 'rgb(103, 88, 230)',
                            },
                        })}
                    >
                        Confirm
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default SelectAccountModal;
