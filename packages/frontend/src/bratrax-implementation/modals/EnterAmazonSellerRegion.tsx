import {
    Button,
    Group,
    Modal,
    MultiSelect,
    Select,
    Stack,
    TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { z } from 'zod';

interface EnterAmazonSellerUrlProps {
    opened: boolean;
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

const schema = z.object({
    seller_url: z
        .string()
        .min(1, 'Please enter your Marketplace URL')
        .regex(
            /^https:\/\/sellercentral.*$/,
            'URL must start with https://sellercentral',
        ),
    marketplaces: z
        .array(z.string())
        .min(1, 'Please select at least one marketplace'),
    sales_data_granularity: z.enum(['ORDER', 'SUMMARY']),
    start_date: z.date(),
});

export const EnterAmazonSellerRegion = ({
    opened,
    onClose,
    onSubmit,
    isLoading = false,
}: EnterAmazonSellerUrlProps) => {
    const form = useForm({
        initialValues: {
            seller_url: '',
            marketplaces: [] as string[],
            sales_data_granularity: 'ORDER' as const,
            start_date: new Date(),
        },
        validate: (values) => {
            try {
                schema.parse(values);
                return {};
            } catch (error) {
                if (error instanceof z.ZodError) {
                    return error.formErrors.fieldErrors;
                }
                return {};
            }
        },
    });

    const handleSubmit = (values: typeof form.values) => {
        onSubmit({
            ...values,
            start_date: values.start_date.toISOString().split('T')[0],
        });
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Amazon Seller Central Configuration"
            size="lg"
            centered
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="md">
                    <TextInput
                        label="Marketplace URL"
                        placeholder="https://sellercentral.amazon.com"
                        description="Enter your Amazon Seller Central URL"
                        required
                        {...form.getInputProps('seller_url')}
                    />

                    <MultiSelect
                        label="Marketplaces"
                        placeholder="Select marketplaces"
                        data={MARKETPLACE_OPTIONS}
                        required
                        {...form.getInputProps('marketplaces')}
                    />

                    <Select
                        label="Sales Data Granularity"
                        placeholder="Select data granularity"
                        data={[
                            { label: 'Order Level', value: 'ORDER' },
                            { label: 'Summary Level', value: 'SUMMARY' },
                        ]}
                        required
                        {...form.getInputProps('sales_data_granularity')}
                    />

                    <DatePickerInput
                        label="Start Date"
                        required
                        {...form.getInputProps('start_date')}
                    />

                    <Group position="right" mt="xl">
                        <Button variant="light" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={isLoading}>
                            Submit
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
