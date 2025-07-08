import { Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

interface EnterShopifyShopUrlProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (shopUrl: string) => void;
    isLoading?: boolean;
}

interface FormValues {
    shopUrl: string;
}

export const EnterShopifyShopUrl = ({
    isOpen,
    onClose,
    onSubmit,
    isLoading = false,
}: EnterShopifyShopUrlProps) => {
    const form = useForm<FormValues>({
        initialValues: {
            shopUrl: '',
        },
        validate: {
            shopUrl: (value) =>
                /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/.test(value)
                    ? null
                    : 'Please enter a valid Shopify URL (example: store-name.myshopify.com)',
        },
    });

    const handleSubmit = (values: FormValues) => {
        onSubmit(values.shopUrl);
    };

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title="Enter Shopify Shop URL"
            size="md"
            radius="md"
            centered
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
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="md">
                    <TextInput
                        label="Shop URL"
                        placeholder="store-name.myshopify.com"
                        required
                        autoComplete="off"
                        {...form.getInputProps('shopUrl')}
                    />

                    <Group position="right" spacing="sm" mt="md">
                        <Button variant="default" onClick={onClose} radius="sm">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            loading={isLoading}
                            radius="sm"
                            sx={(theme) => ({
                                backgroundColor: 'rgb(114, 98, 255)',
                                '&:hover': {
                                    backgroundColor: 'rgb(103, 88, 230)',
                                },
                            })}
                        >
                            Submit
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};
