import { Form, Input, Modal } from 'antd';

interface EnterShopifyShopUrlProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (shopUrl: string) => void;
    isLoading?: boolean;
}

export const EnterShopifyShopUrl = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
}: EnterShopifyShopUrlProps) => {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values.shopUrl);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title="Enter Shopify Shop URL"
            open={isOpen}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Submit"
            confirmLoading={isLoading}
            centered
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="shopUrl"
                    label="Shop URL"
                    rules={[
                        { required: true, message: 'Please enter your Shopify shop URL' },
                        {
                            pattern: /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/,
                            message: 'Please enter a valid Shopify URL (example: store-name.myshopify.com)',
                        },
                    ]}
                >
                    <Input
                        placeholder="store-name.myshopify.com"
                        autoComplete="off"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};
