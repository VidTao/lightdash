import {
    Box,
    Button,
    Card,
    Center,
    FileButton,
    Grid,
    Group,
    Image,
    Select,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconPhoto } from '@tabler/icons-react';
import React, { useState } from 'react';

interface StoreFormValues {
    siteName: string;
    ownerEmail: string;
    shopUrl: string;
    currency: string;
    shopIcon?: File;
}

const Store: React.FC = () => {
    const [imageUrl, setImageUrl] = useState<string>();

    const form = useForm<StoreFormValues>({
        initialValues: {
            siteName: '',
            ownerEmail: '',
            shopUrl: '',
            currency: 'USD',
            shopIcon: undefined,
        },
        validate: {
            siteName: (value) =>
                !value ? 'Please enter your site name' : null,
            ownerEmail: (value) => {
                if (!value) return 'Please enter owner email';
                if (!/^\S+@\S+$/.test(value))
                    return 'Please enter a valid email';
                return null;
            },
            shopUrl: (value) => (!value ? 'Please enter shop URL' : null),
        },
    });

    const handleImageUpload = (file: File) => {
        if (file) {
            setImageUrl(URL.createObjectURL(file));
            form.setFieldValue('shopIcon', file);
            notifications.show({
                title: 'Success',
                message: `${file.name} uploaded successfully`,
                color: 'green',
            });
        }
    };

    const onSubmit = (values: StoreFormValues) => {
        console.log('Form values:', values);
    };

    return (
        <Box p="xl">
            <Stack mb="xl">
                <Title order={2}>General</Title>
                <Text c="dimmed">Basic information about your store</Text>
            </Stack>

            <Card withBorder>
                <form onSubmit={form.onSubmit(onSubmit)}>
                    <Grid gutter="xl">
                        <Grid.Col span={6}>
                            <Stack>
                                <TextInput
                                    label="Site Name"
                                    placeholder="Enter site name"
                                    description="Use the brand name of your website. For example 'GymShark' or 'Allbirds'"
                                    {...form.getInputProps('siteName')}
                                />

                                <TextInput
                                    label="Account Owner Email"
                                    placeholder="Enter owner email"
                                    description="Administrative-related communication, including billing and account updates."
                                    {...form.getInputProps('ownerEmail')}
                                />

                                <TextInput
                                    label="Shop URL"
                                    placeholder="Enter shop URL"
                                    description="The URL of your store. For example 'www.gymshark.com' or 'allbirds.com'"
                                    {...form.getInputProps('shopUrl')}
                                />

                                <Select
                                    label="Default Currency"
                                    data={[
                                        { value: 'USD', label: 'USD' },
                                        { value: 'EUR', label: 'EUR' },
                                        { value: 'GBP', label: 'GBP' },
                                        { value: 'AUD', label: 'AUD' },
                                    ]}
                                    {...form.getInputProps('currency')}
                                />
                            </Stack>
                        </Grid.Col>

                        <Grid.Col span={6}>
                            <Stack>
                                <Text fw={500} size="sm">
                                    Shop Icon
                                </Text>
                                <Center>
                                    <FileButton
                                        onChange={handleImageUpload}
                                        accept="image/png,image/jpeg"
                                    >
                                        {(props) => (
                                            <Box
                                                {...props}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                {imageUrl ? (
                                                    <Box pos="relative">
                                                        <Image
                                                            src={imageUrl}
                                                            alt="Shop Icon"
                                                            width={128}
                                                            height={128}
                                                            radius="50%"
                                                        />
                                                        <Center
                                                            pos="absolute"
                                                            top={0}
                                                            left={0}
                                                            right={0}
                                                            bottom={0}
                                                            sx={(theme) => ({
                                                                borderRadius:
                                                                    '50%',
                                                                backgroundColor:
                                                                    'rgba(0, 0, 0, 0.4)',
                                                                opacity: 0,
                                                                transition:
                                                                    'opacity 0.2s',
                                                                '&:hover': {
                                                                    opacity: 1,
                                                                },
                                                            })}
                                                        >
                                                            <IconEdit
                                                                color="white"
                                                                size={24}
                                                            />
                                                        </Center>
                                                    </Box>
                                                ) : (
                                                    <Center
                                                        w={128}
                                                        h={128}
                                                        bg="gray.1"
                                                        sx={{
                                                            borderRadius: '50%',
                                                        }}
                                                    >
                                                        <Stack align="center">
                                                            <IconPhoto
                                                                size={32}
                                                                color="gray"
                                                            />
                                                            <Text c="dimmed">
                                                                Upload Icon
                                                            </Text>
                                                        </Stack>
                                                    </Center>
                                                )}
                                            </Box>
                                        )}
                                    </FileButton>
                                </Center>
                            </Stack>
                        </Grid.Col>
                    </Grid>

                    <Group mt="xl">
                        <Button type="submit" size="md" px="xl">
                            Save
                        </Button>
                    </Group>
                </form>
            </Card>
        </Box>
    );
};

export default Store;
