import React, { useState } from 'react';
import { Modal, Form, Input, Select, message, Button } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { apiService } from '../../services/api';

interface InviteUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: InviteUserData) => Promise<void>;
}

interface InviteUserData {
    email: string;
    name?: string;
    role: 'admin' | 'user';
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [form] = Form.useForm();
    const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const checkEmail = async () => {
        try {
            const email = form.getFieldValue('email');

            if (!email) {
                message.error('Please enter an email');
                return;
            }

            setIsCheckingEmail(true);
            const response = await apiService.checkEmailAvailability(email);
            console.log('Response:', response);
            setIsEmailAvailable(response.isAvailable);

            if (response.isAvailable) {
                message.success('Email is available');
            } else {
                message.error('Email is already in use');
            }
        } catch (error) {
            message.error('Failed to check email availability');
            setIsEmailAvailable(false);
        } finally {
            setIsCheckingEmail(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!isEmailAvailable) {
                message.error('Please verify email availability first');
                return;
            }
            const values = await form.validateFields();
            setIsLoading(true);
            await onSubmit(values);
            form.resetFields();
            setIsEmailAvailable(null);
            onClose();
        } catch (error) {
            message.error('Please check your input and try again');
        }
    };

    return (
        <Modal
            title="Invite Team Member"
            open={isOpen}
            onCancel={onClose}
            onOk={handleSubmit}
            confirmLoading={isLoading}
            okText="Invite"
            okButtonProps={{ disabled: !isEmailAvailable }}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ role: 'user' }}
            >
                <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                        { required: true, message: 'Please input email' },
                        { type: 'email', message: 'Please enter a valid email' }
                    ]}
                >
                    <Input.Group compact>
                        <Form.Item
                            name="email"
                            noStyle
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="Enter email address"
                                style={{ width: 'calc(100% - 120px)' }}
                                onChange={() => setIsEmailAvailable(null)}
                            />
                        </Form.Item>
                        <Button
                            type="primary"
                            onClick={checkEmail}
                            loading={isCheckingEmail}
                            style={{ width: '120px' }}
                        >
                            Check Email
                        </Button>
                    </Input.Group>
                </Form.Item>

                {isEmailAvailable !== null && (
                    <div style={{
                        marginTop: -20,
                        marginBottom: 16,
                        color: isEmailAvailable ? '#52c41a' : '#ff4d4f'
                    }}>
                        {isEmailAvailable
                            ? '✓ Email is available'
                            : '✗ Email is not available'}
                    </div>
                )}

                <Form.Item
                    name="name"
                    label="Name"
                >
                    <Input
                        prefix={<UserOutlined />}
                        placeholder="Enter name (optional)"
                    />
                </Form.Item>

                <Form.Item
                    name="role"
                    label="Role"
                    rules={[{ required: true, message: 'Please select a role' }]}
                >
                    <Select>
                        <Select.Option value="user">User</Select.Option>
                        <Select.Option value="admin">Admin</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default InviteUserModal;