import React from 'react';
import { Modal, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CrmConnection } from '../../models/interfaces';

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

    const columns: ColumnsType<CrmConnection> = [
        {
            title: 'Store Name',
            dataIndex: 'storeName',
            key: 'storeName',
            render: (text: string) => (
                <Typography.Text strong>{text}</Typography.Text>
            ),
        },
        {
            title: 'Store URL',
            dataIndex: 'storeUrl',
            key: 'storeUrl',
            render: (url: string) => (
                <Tag color="blue">
                    {url}
                </Tag>
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
            title="CRM Connections"
            open={isOpen}
            onCancel={onClose}
            width={1000}
            footer={null}
        >
            <Table
                columns={columns}
                dataSource={safeConnections}
                rowKey={(record) => `${record.storeUrl}-${record.createdAt}`}
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
