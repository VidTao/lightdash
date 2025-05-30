import { Modal, Form, Input, Select } from 'antd';
import type { SelectProps } from 'antd';
import { Property } from '../../pages/tracking-plan/types';

const { TextArea } = Input;


interface CustomEventFormData {
    name: string;
    description: string;
    properties: string[];
}

interface AddCustomEventModalProps {
    properties: Property[]
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (values: CustomEventFormData) => void;
}

const AddCustomEventModal = ({ isOpen, onClose, onSubmit, properties }: AddCustomEventModalProps) => {
    const [form] = Form.useForm();
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            onSubmit(values);
            form.resetFields();
            onClose();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };
    const propertyOptions = properties.map(prop => ({
        label: prop.name,
        value: prop.id, // Using property_id as the value
        description: prop.description, // Optional: can be used for tooltips or custom rendering
    }));

    return (
        <Modal
            title="Add Custom Event"
            open={isOpen}
            onCancel={onClose}
            onOk={handleSubmit}
            okText="Create Event"
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                className="mt-4"
            >
                <Form.Item
                    name="name"
                    label="Event Name"
                    rules={[
                        { required: true, message: 'Please enter event name' },
                        { pattern: /^[a-zA-Z0-9_]+$/, message: 'Only alphanumeric characters and underscores are allowed' }
                    ]}
                >
                    <Input placeholder="Enter event name" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter event description' }]}
                >
                    <TextArea
                        rows={4}
                        placeholder="Describe the purpose of this event"
                    />
                </Form.Item>

                <Form.Item
                    name="properties"
                    label="Properties"
                    rules={[{ required: true, message: 'Please select at least one property' }]}
                >
                    <Select
                        mode="multiple"
                        placeholder="Select properties"
                        options={propertyOptions}
                        className="w-full"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AddCustomEventModal;