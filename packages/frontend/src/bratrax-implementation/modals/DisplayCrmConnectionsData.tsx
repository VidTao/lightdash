import { Badge, Modal, ScrollArea, Table, Text } from '@mantine/core';
import React from 'react';
import { CrmConnection } from '../models/interfaces';

interface DisplayCrmDataProps {
    isOpen: boolean;
    onClose: () => void;
    crmConnections: CrmConnection[] | undefined;
}

export const DisplayCrmConnectionsData: React.FC<DisplayCrmDataProps> = ({
    isOpen,
    onClose,
    crmConnections,
}) => {
    const safeConnections = Array.isArray(crmConnections) ? crmConnections : [];

    const rows = safeConnections.map((connection) => (
        <tr key={`${connection.storeUrl}-${connection.createdAt}`}>
            <td>
                <Text weight={600} size="sm">
                    {connection.storeName}
                </Text>
            </td>
            <td>
                <Badge
                    variant="light"
                    color="indigo"
                    sx={(theme) => ({
                        fontWeight: 500,
                        textTransform: 'none',
                    })}
                >
                    {connection.storeUrl}
                </Badge>
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
            title="CRM Connections"
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
                            <th>Store Name</th>
                            <th>Store URL</th>
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
