import React from 'react';
import { Modal, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AdvertisingConnection } from '../../models/interfaces';

interface DisplayAdvertisingDataProps {
    isOpen: boolean;
    onClose: () => void;
    advertisingConnections: AdvertisingConnection[] | undefined;
}

export const DisplayAdConnectionsData: React.FC<DisplayAdvertisingDataProps> = ({
    isOpen,
    onClose,
    advertisingConnections,
}) => {
    const safeConnections = Array.isArray(advertisingConnections) ? advertisingConnections : [];

    const columns: ColumnsType<AdvertisingConnection> = [
        {
            title: 'Account Name',
            dataIndex: 'accountName', // Note: This matches the interface but appears to be a typo
            key: 'accountName',
            render: (text: string) => (
                <Typography.Text strong>{text}</Typography.Text>
            ),
        },
        {
            title: 'Currency',
            dataIndex: 'currency',
            key: 'currency',
        },
        {
            title: 'Timezone',
            dataIndex: 'timezone',
            key: 'timezone',
        },
    ];

    return (
        <Modal
            title="Connected Accounts"
            open={isOpen}
            onCancel={onClose}
            width={1000}
            footer={null}
        >
            <Table
                columns={columns}
                dataSource={safeConnections}
                rowKey={(record) => `${record.accountName}-${record.createdAt}`}
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} items`,
                }}
                scroll={{ x: 800 }}
            />
        </Modal>
    );
};