import { Modal, Form, Input, DatePicker, Select } from 'antd';

interface EnterAmazonSellerUrlProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: AmazonCredentials) => void;
    isLoading?: boolean;
}

interface AmazonCredentials {
    seller_url: string;
    marketplaces: string[];
    sales_data_granularity: 'ORDER' | 'SUMMARY';
    start_date: string;
}

const MARKETPLACE_OPTIONS = [
    { label: 'United States (US)', value: 'A2Q3Y263D00KWC' },
    { label: 'Canada (CA)', value: 'A2EUQ1WTGCTBG2' },
    { label: 'United Kingdom (UK)', value: 'A1F83G8C2ARO7P' },
    { label: 'Germany (DE)', value: 'A1PA6795UKMFR9' },
    { label: 'France (FR)', value: 'A13V1IB3VIYZZH' },
    { label: 'Italy (IT)', value: 'APJ6JRA9NG5V4' },
    { label: 'Spain (ES)', value: 'A1RKKUPIHCS9HS' },
    { label: 'Netherlands (NL)', value: 'A1805IZSGTT6HS' },
];

export const EnterAmazonSellerRegion = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
}: EnterAmazonSellerUrlProps) => {
    const [form] = Form.useForm();

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSubmit({
                ...values,
                start_date: values.start_date.format('YYYY-MM-DD'),
            });
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    return (
        <Modal
            title="Amazon Seller Central Configuration"
            open={isOpen}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Submit"
            confirmLoading={isLoading}
            centered
            width={600}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="seller_url"
                    label="Marketplace URL"
                    extra="Enter your Amazon Seller Central URL"
                    rules={[
                        {
                            required: true,
                            message: 'Please enter your Marketplace URL',
                        },
                        {
                            pattern: /^https:\/\/sellercentral.*$/,
                            message: 'URL must start with https://sellercentral',
                        },
                    ]}
                >
                    <Input placeholder="https://sellercentral.amazon.com" />
                </Form.Item>

                <Form.Item
                    name="marketplaces"
                    label="Marketplaces"
                    rules={[{ required: true, message: 'Please select at least one marketplace' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select marketplaces"
                        options={MARKETPLACE_OPTIONS}
                    />
                </Form.Item>

                <Form.Item
                    name="sales_data_granularity"
                    label="Sales Data Granularity"
                    rules={[{ required: true, message: 'Please select data granularity' }]}
                >
                    <Select
                        options={[
                            { label: 'Order Level', value: 'ORDER' },
                            { label: 'Summary Level', value: 'SUMMARY' },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    name="start_date"
                    label="Start Date"
                    rules={[{ required: true, message: 'Please select start date' }]}
                >
                    <DatePicker />
                </Form.Item>
            </Form>
        </Modal>
    );
}; 