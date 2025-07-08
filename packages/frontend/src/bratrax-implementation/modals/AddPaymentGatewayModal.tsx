import {
    Button,
    Group,
    Modal,
    NumberInput,
    Stack,
    TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import React, { useState } from 'react';
import { PaymentGatewaySettings } from '../models/interfaces';
import { apiService } from '../services/api';

interface AddPaymentGatewayModalProps {
    opened: boolean;
    onClose: () => void;
    refetchPaymentGateways: () => void;
}

const AddPaymentGatewayModal = ({
    opened,
    onClose,
    refetchPaymentGateways,
}: AddPaymentGatewayModalProps) => {
    const [writeKey] = useState<string>('b6175fb3-dc45-45b6-9da8-5fc0f4d0e21d');

    const form = useForm({
        initialValues: {
            Name: '',
            Cost: 0,
            Fee: 0,
        },
        validate: {
            Name: (value) => (value ? null : 'Name is required'),
            Cost: (value) => (value >= 0 ? null : 'Cost must be positive'),
            Fee: (value) => (value >= 0 ? null : 'Fee must be positive'),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        try {
            const paymentGatewaySettings: PaymentGatewaySettings = {
                gatewayId: 0,
                writeKey: writeKey,
                gatewayName: values.Name,
                percentageFee: values.Fee,
                fixedFee: values.Cost,
                isShopifyPayments: false,
            };

            const response = await apiService.insertPaymentGatewaySettings(
                paymentGatewaySettings,
            );
            console.log('Payment gateway settings inserted:', response);
            form.reset();
            onClose();
            refetchPaymentGateways();
        } catch (error) {
            console.error('Error inserting payment gateway settings:', error);
        }
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Add Payment Gateway"
            size="md"
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="md">
                    <TextInput
                        label="Name"
                        placeholder="Name"
                        required
                        {...form.getInputProps('Name')}
                    />
                    <NumberInput
                        label="Cost"
                        placeholder="Cost"
                        required
                        min={0}
                        precision={2}
                        {...form.getInputProps('Cost')}
                    />
                    <NumberInput
                        label="Fee %"
                        placeholder="Fee"
                        required
                        min={0}
                        precision={2}
                        {...form.getInputProps('Fee')}
                    />
                    <Group position="right" mt="md">
                        <Button variant="light" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Submit</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default AddPaymentGatewayModal;
