import { Modal, ScrollArea, Table, Text } from '@mantine/core';
import React from 'react';
import { AdvertisingConnection } from '../models/interfaces';

interface DisplayAdvertisingDataProps {
    isOpen: boolean;
    onClose: () => void;
    advertisingConnections: AdvertisingConnection[] | undefined;
}

export const DisplayAdConnectionsData: React.FC<
    DisplayAdvertisingDataProps
> = ({ isOpen, onClose, advertisingConnections }) => {
    const safeConnections = Array.isArray(advertisingConnections)
        ? advertisingConnections
        : [];

    const rows = safeConnections.map((connection) => (
        <tr key={`${connection.accountName}-${connection.createdAt}`}>
            <td>
                <Text weight={600} size="sm">
                    {connection.accountName}
                </Text>
            </td>
            <td>
                <Text size="sm" color="dimmed">
                    {connection.currency}
                </Text>
            </td>
            <td>
                <Text size="sm" color="dimmed">
                    {connection.timezone}
                </Text>
            </td>
        </tr>
    ));

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title="Connected Accounts"
            size="xl"
            radius="md"
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
            <ScrollArea>
                <Table
                    striped
                    highlightOnHover
                    horizontalSpacing="lg"
                    verticalSpacing="md"
                    fontSize="sm"
                    sx={(theme) => ({
                        'thead tr th': {
                            background: theme.colors.gray[0],
                            padding: '12px 16px',
                            fontWeight: 600,
                            color: theme.colors.gray[7],
                            fontSize: theme.fontSizes.sm,
                            '&:first-of-type': {
                                borderTopLeftRadius: theme.radius.sm,
                            },
                            '&:last-of-type': {
                                borderTopRightRadius: theme.radius.sm,
                            },
                        },
                        'tbody tr td': {
                            padding: '12px 16px',
                            borderBottom: `1px solid ${theme.colors.gray[2]}`,
                        },
                        'tbody tr:last-of-type td': {
                            borderBottom: 'none',
                        },
                    })}
                >
                    <thead>
                        <tr>
                            <th>Account Name</th>
                            <th>Currency</th>
                            <th>Timezone</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </Table>
            </ScrollArea>
        </Modal>
    );
};
