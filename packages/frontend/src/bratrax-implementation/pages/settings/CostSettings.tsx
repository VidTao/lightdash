import {
    Accordion,
    Box,
    Button,
    Card,
    Checkbox,
    Collapse,
    Grid,
    Group,
    Input,
    NumberInput,
    Paper,
    Radio,
    Select,
    Stack,
    Table,
    Tabs,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import {
    IconCheck,
    IconCreditCard,
    IconCurrency,
    IconEdit,
    IconInfoCircle,
    IconPlus,
    IconQuestionMark,
    IconSettings,
    IconShoppingCart,
    IconTrash,
    IconTruck,
    IconUpload,
} from '@tabler/icons-react';
import React, { useState } from 'react';
import { useDebounce } from 'use-debounce';
import { usePaymentGateways } from '../../hooks/usePaymentGetaways';
import { useProductsCogsSettings } from '../../hooks/useProductsCogsSettings';
import { useShippingProfiles } from '../../hooks/useShippingProfiles';
import { useStoreCogsSettings } from '../../hooks/useStoreCogsSettings';
import AddPaymentGatewayModal from '../../modals/AddPaymentGatewayModal';
import AddShippingProfileModal from '../../modals/AddShippingProfileModal';
import {
    AmazonProduct,
    PaymentGatewaySettings,
    ProductData,
    ShippingProfile,
    VariableExpense,
} from '../../models/interfaces';
import { apiService } from '../../services/api';

const CostSettings: React.FC = () => {
    const [selectedTabKey, setSelectedTabKey] = useState<string>('Shopify');
    const [selectedMarketplace, setSelectedMarketplace] =
        useState<string>('ATVPDKIKX0DER');
    const {
        cogsSettings,
        setCogsSettings,
        updateStoreCogsSettings,
        isLoading: isStoreCogsSettingsLoading,
    } = useStoreCogsSettings({
        selectedTabKey: selectedTabKey,
    });
    const {
        productsCogsSettings,
        setProductsCogsSettings,
        updateProductsCogsSettings,
        isLoading: isProductsCogsSettingsLoading,
    } = useProductsCogsSettings({
        selectedTabKey: selectedTabKey,
        selectedMarketplace: selectedMarketplace,
    });
    const [selectedShippingOption, setSelectedShippingOption] =
        useState<string>('shipping-charges');
    const {
        shippingProfiles,
        fetchShippingProfiles,
        updateShippingProfile,
        isLoading: isShippingProfilesLoading,
    } = useShippingProfiles();
    const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] =
        useState(false);
    const [isAddPaymentGatewayModalOpen, setIsAddPaymentGatewayModalOpen] =
        useState(false);
    const {
        paymentGateways,
        fetchPaymentGateways,
        isLoading: isPaymentGatewaysLoading,
        setPaymentGateways,
    } = usePaymentGateways();
    const [includeInPixel, setIncludeInPixel] = useState(false);
    const [variableExpenses, setVariableExpenses] = useState<VariableExpense[]>(
        [
            {
                key: '1',
                name: 'OPEX (Amazon)',
                category: 'Uncategorized',
                metric: 'Total Revenue',
                percent: 10,
                startDate: '2023-12-31',
                endDate: null,
                adSpend: false,
            },
            {
                key: '2',
                name: 'OPEX (Shopify)',
                category: 'Uncategorized',
                metric: 'Total Revenue',
                percent: 10,
                startDate: '2023-12-31',
                endDate: null,
                adSpend: false,
            },
            {
                key: '3',
                name: 'Amazon Return Rate',
                category: 'Uncategorized',
                metric: 'Net Sales',
                percent: 8,
                startDate: '2023-12-31',
                endDate: null,
                adSpend: false,
            },
        ],
    );
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [debouncedSearchQuery] = useDebounce(searchQuery, 400);
    const filteredproductsCogsSettings = productsCogsSettings.filter((item) => {
        return item.title
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase());
    });

    const isSavingChanges =
        isShippingProfilesLoading ||
        isProductsCogsSettingsLoading ||
        isStoreCogsSettingsLoading;

    const productColumns = [
        {
            accessor: 'title',
            title: 'Title',
            render: (row: ProductData) => (
                <Text component="a" href="#" size="sm">
                    {row.title}
                </Text>
            ),
        },
        {
            accessor: 'price',
            title: 'Price',
            render: (row: ProductData) => <Text>${row.price}</Text>,
        },
        {
            accessor: 'sku',
            title: 'SKU',
        },
        {
            accessor: 'productCost',
            title: 'Product Cost',
            render: (row: ProductData) => (
                <NumberInput
                    value={row.productCost}
                    onChange={(value) => {
                        const updatedData = productsCogsSettings.map((item) =>
                            item.productId === row.productId
                                ? {
                                      ...item,
                                      productCost: value || 0,
                                      cogsAmount:
                                          (value || 0) + item.handlingFee,
                                  }
                                : item,
                        );
                        setProductsCogsSettings(updatedData);
                    }}
                    prefix="$"
                    w="100%"
                />
            ),
        },
        {
            accessor: 'handlingFee',
            title: 'Handling Fees',
            render: (row: ProductData) => (
                <NumberInput
                    value={row.handlingFee}
                    onChange={(value) => {
                        const updatedData = productsCogsSettings.map((item) =>
                            item.productId === row.productId
                                ? {
                                      ...item,
                                      handlingFee: value || 0,
                                      cogsAmount:
                                          item.productCost + (value || 0),
                                  }
                                : item,
                        );
                        setProductsCogsSettings(updatedData);
                    }}
                    prefix="$"
                    w="100%"
                />
            ),
        },
        {
            accessor: 'quantity',
            title: 'Qty',
            textAlignment: 'right',
        },
    ];

    const amazonProducts: AmazonProduct[] = [
        {
            key: '1',
            productName:
                'Vibit - Vibrating Massager for Plantar Fasciitis, Pain Relief and Sciatica, Foot and Body Portable',
            sku: 'vib-ROLL-grn-NEW2',
            costCOGS: 0,
            handlingFee: 0,
        },
        {
            key: '2',
            productName:
                'Vibit - Vibrating Massager for Plantar Fasciitis, Pain Relief and Sciatica, Foot and Body Portable',
            sku: 'vib-ROLL-blu-FBA',
            costCOGS: 0,
            handlingFee: 0,
        },
        {
            key: '3',
            productName:
                'Vibit - Vibrating Massage Roller for Foot, Leg, Muscles, and More, Great for Pain Relief, Sciatica',
            sku: 'vib-ROLL-ppl',
            costCOGS: 13.5,
            handlingFee: 3,
        },
        {
            key: '4',
            productName:
                'Vibit - Vibrating Massage Roller for Foot, Leg, Muscles, and More, Great for Pain Relief, Sciatica',
            sku: 'vib-ROLL-pnk',
            costCOGS: 13.5,
            handlingFee: 3,
        },
        {
            key: '5',
            productName:
                'Vibit - Vibrating Massage Roller for Foot, Leg, Muscles, and More, Great for Pain Relief, Sciatica',
            sku: 'vib-ROLL-grn',
            costCOGS: 13.5,
            handlingFee: 3,
        },
    ];

    const amazonColumns = [
        {
            title: 'Product Name',
            dataIndex: 'productName',
            key: 'productName',
            width: '40%',
        },
        {
            title: 'SKU',
            dataIndex: 'sku',
            key: 'sku',
            width: '20%',
        },
        {
            title: 'Cost (COGS)',
            dataIndex: 'costCOGS',
            key: 'costCOGS',
            width: '20%',
            render: (value: number) => (
                <NumberInput prefix="$" value={value} w="100%" />
            ),
        },
        {
            title: 'Handling Fee',
            dataIndex: 'handlingFee',
            key: 'handlingFee',
            width: '20%',
            render: (value: number) => (
                <NumberInput prefix="$" value={value} w="100%" />
            ),
        },
    ];

    const tabItems = [
        {
            value: 'Shopify',
            label: 'Shopify COGS',
            content: (
                <Stack spacing="md">
                    <Group align="flex-start" spacing="sm" mb="sm">
                        <Checkbox
                            checked={cogsSettings.enableCOGS}
                            onChange={(e) =>
                                setCogsSettings({
                                    ...cogsSettings,
                                    enableCOGS: e.currentTarget.checked,
                                })
                            }
                            label="Enable COGS as % of Gross Sales"
                        />
                        <IconQuestionMark size={16} color="gray" />
                    </Group>

                    <Group align="flex-start" spacing="sm" mb="sm">
                        <Checkbox
                            checked={cogsSettings.bidirectionalCOGS}
                            onChange={(e) =>
                                setCogsSettings({
                                    ...cogsSettings,
                                    bidirectionalCOGS: e.currentTarget.checked,
                                })
                            }
                            label="Bi-Directional COGS"
                        />
                        <IconQuestionMark size={16} color="gray" />
                    </Group>

                    <Group position="apart" align="flex-start" mb="sm">
                        <Group align="center" spacing="sm">
                            <Checkbox
                                checked={cogsSettings.enableHandlingFee}
                                onChange={(e) =>
                                    setCogsSettings({
                                        ...cogsSettings,
                                        enableHandlingFee:
                                            e.currentTarget.checked,
                                    })
                                }
                                label="Enable Fixed Handling Fee per Order"
                            />
                            <IconQuestionMark size={16} color="gray" />
                        </Group>
                        {cogsSettings.enableHandlingFee && (
                            <Group spacing="xs">
                                <Text>Fixed Handling Fee</Text>
                                <NumberInput
                                    value={cogsSettings.handlingFee}
                                    onChange={(value) =>
                                        setCogsSettings({
                                            ...cogsSettings,
                                            handlingFee: value || 0,
                                        })
                                    }
                                    prefix="$"
                                    w={200}
                                />
                            </Group>
                        )}
                    </Group>

                    <Box>
                        <Text weight={600} mb="xs">
                            Search Products
                        </Text>
                        <TextInput
                            placeholder="Search by product name"
                            value={searchQuery}
                            onChange={(e) =>
                                setSearchQuery(e.currentTarget.value)
                            }
                            mb="md"
                        />
                        <Table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Price</th>
                                    <th>SKU</th>
                                    <th>Product Cost</th>
                                    <th>Handling Fees</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredproductsCogsSettings.map((item) => (
                                    <tr key={item.productId}>
                                        <td>
                                            <Text
                                                component="a"
                                                href="#"
                                                size="sm"
                                            >
                                                {item.title}
                                            </Text>
                                        </td>
                                        <td>${item.price}</td>
                                        <td>{item.sku}</td>
                                        <td>
                                            <NumberInput
                                                value={item.productCost}
                                                onChange={(value) => {
                                                    const updatedData =
                                                        productsCogsSettings.map(
                                                            (record) =>
                                                                record.productId ===
                                                                item.productId
                                                                    ? {
                                                                          ...record,
                                                                          productCost:
                                                                              value ||
                                                                              0,
                                                                          cogsAmount:
                                                                              (value ||
                                                                                  0) +
                                                                              record.handlingFee,
                                                                      }
                                                                    : record,
                                                        );
                                                    setProductsCogsSettings(
                                                        updatedData,
                                                    );
                                                }}
                                                prefix="$"
                                                w="100%"
                                            />
                                        </td>
                                        <td>
                                            <NumberInput
                                                value={item.handlingFee}
                                                onChange={(value) => {
                                                    const updatedData =
                                                        productsCogsSettings.map(
                                                            (record) =>
                                                                record.productId ===
                                                                item.productId
                                                                    ? {
                                                                          ...record,
                                                                          handlingFee:
                                                                              value ||
                                                                              0,
                                                                          cogsAmount:
                                                                              record.productCost +
                                                                              (value ||
                                                                                  0),
                                                                      }
                                                                    : record,
                                                        );
                                                    setProductsCogsSettings(
                                                        updatedData,
                                                    );
                                                }}
                                                prefix="$"
                                                w="100%"
                                            />
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {item.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Box>
                </Stack>
            ),
        },
        {
            value: 'AmazonSP',
            label: 'Amazon COGS',
            content: (
                <Stack spacing="sm">
                    <Group position="apart" align="center" mb="sm">
                        <Box style={{ flex: 1 }}>
                            <Text weight={600} mb="xs">
                                Select Amazon Marketplace
                            </Text>
                            <Select
                                value={selectedMarketplace}
                                onChange={(value) =>
                                    setSelectedMarketplace(value || '')
                                }
                                data={[
                                    {
                                        value: 'ATVPDKIKX0DER',
                                        label: 'United States of America',
                                    },
                                    {
                                        value: 'A2EUQ1WTGCTBG2',
                                        label: 'Canada',
                                    },
                                    {
                                        value: 'A1AM78C64UM0Y8',
                                        label: 'Mexico',
                                    },
                                    {
                                        value: 'A2Q3Y263D00KWC',
                                        label: 'United Kingdom',
                                    },
                                ]}
                                style={{ maxWidth: 400 }}
                            />
                        </Box>
                        <Button leftIcon={<IconUpload size={16} />}>
                            Upload COGs
                        </Button>
                    </Group>

                    <Table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Price</th>
                                <th>SKU</th>
                                <th>Product Cost</th>
                                <th>Handling Fees</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredproductsCogsSettings.map((item) => (
                                <tr key={item.productId}>
                                    <td>
                                        <Text component="a" href="#" size="sm">
                                            {item.title}
                                        </Text>
                                    </td>
                                    <td>${item.price}</td>
                                    <td>{item.sku}</td>
                                    <td>
                                        <NumberInput
                                            value={item.productCost}
                                            onChange={(value) => {
                                                const updatedData =
                                                    productsCogsSettings.map(
                                                        (record) =>
                                                            record.productId ===
                                                            item.productId
                                                                ? {
                                                                      ...record,
                                                                      productCost:
                                                                          value ||
                                                                          0,
                                                                      cogsAmount:
                                                                          (value ||
                                                                              0) +
                                                                          record.handlingFee,
                                                                  }
                                                                : record,
                                                    );
                                                setProductsCogsSettings(
                                                    updatedData,
                                                );
                                            }}
                                            prefix="$"
                                            w="100%"
                                        />
                                    </td>
                                    <td>
                                        <NumberInput
                                            value={item.handlingFee}
                                            onChange={(value) => {
                                                const updatedData =
                                                    productsCogsSettings.map(
                                                        (record) =>
                                                            record.productId ===
                                                            item.productId
                                                                ? {
                                                                      ...record,
                                                                      handlingFee:
                                                                          value ||
                                                                          0,
                                                                      cogsAmount:
                                                                          record.productCost +
                                                                          (value ||
                                                                              0),
                                                                  }
                                                                : record,
                                                    );
                                                setProductsCogsSettings(
                                                    updatedData,
                                                );
                                            }}
                                            prefix="$"
                                            w="100%"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Stack>
            ),
        },
    ];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] =
        useState<ShippingProfile | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);

    const handleAddShippingProfile = () => {
        setIsEditMode(false);
        setEditingProfile(null);
        setIsModalOpen(true);
    };

    const handleEditShippingProfile = (record: ShippingProfile) => {
        setIsEditMode(true);
        setEditingProfile(record);
        setIsModalOpen(true);
    };

    const handleUpdatePaymentGateway = async (
        record: PaymentGatewaySettings,
    ) => {
        await apiService.updatePaymentGatewaySettings(record);
        fetchPaymentGateways();
    };

    const handleSaveChanges = async () => {
        console.log('Saving changes...');
        await Promise.all([
            updateStoreCogsSettings(),
            updateProductsCogsSettings(),
        ]);
    };

    return (
        <Box p="xl">
            <Stack mb="md">
                <Title order={2}>Cost Settings</Title>
                <Text c="dimmed">
                    Manage and configure your business cost tracking
                </Text>
            </Stack>

            <Stack spacing="lg">
                <Accordion defaultValue="costOfGoods">
                    <Accordion.Item value="costOfGoods">
                        <Accordion.Control
                            icon={<IconShoppingCart size={20} />}
                        >
                            <Group position="apart">
                                <Box>
                                    <Text weight={500}>Cost of Goods</Text>
                                    <Text size="sm" c="dimmed">
                                        Track product costs and inventory
                                        expenses
                                    </Text>
                                </Box>
                                <IconCheck size={20} color="green" />
                            </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Tabs
                                value={selectedTabKey}
                                onTabChange={(value) =>
                                    setSelectedTabKey(value || 'Shopify')
                                }
                            >
                                <Tabs.List>
                                    {tabItems.map((item) => (
                                        <Tabs.Tab
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {item.label}
                                        </Tabs.Tab>
                                    ))}
                                </Tabs.List>

                                <Box p="md">
                                    {tabItems.map((item) => (
                                        <Tabs.Panel
                                            key={item.value}
                                            value={item.value}
                                            pt="md"
                                        >
                                            {item.content}
                                        </Tabs.Panel>
                                    ))}
                                </Box>
                            </Tabs>
                        </Accordion.Panel>
                    </Accordion.Item>

                    {/* Shipping */}
                    <Accordion.Item value="shipping">
                        <Accordion.Control icon={<IconTruck size={20} />}>
                            <Group position="apart">
                                <Box>
                                    <Text weight={500}>Shipping</Text>
                                    <Text size="sm" c="dimmed">
                                        Manage shipping and delivery costs
                                    </Text>
                                </Box>
                                <IconCheck size={20} color="green" />
                            </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Box p="md">
                                <Stack spacing="xl">
                                    <Radio.Group
                                        onChange={(e) =>
                                            setSelectedShippingOption(e)
                                        }
                                        value={selectedShippingOption}
                                    >
                                        <Stack spacing="xl">
                                            {/* Use Shipping Charges Option */}
                                            <Stack spacing="sm">
                                                <Radio
                                                    value="shipping-charges"
                                                    label={
                                                        <Box>
                                                            <Text weight={500}>
                                                                Use Shipping
                                                                Charges for
                                                                Shipping Costs
                                                            </Text>
                                                            <Text
                                                                size="sm"
                                                                c="dimmed"
                                                                ml="lg"
                                                            >
                                                                Enable this
                                                                setting if your
                                                                shipping costs
                                                                are equal to
                                                                what your
                                                                customers have
                                                                been charged for
                                                                shipping
                                                            </Text>
                                                        </Box>
                                                    }
                                                />

                                                {selectedShippingOption ===
                                                    'shipping-charges' && (
                                                    <Box ml="lg" mt="xs">
                                                        <Select
                                                            style={{
                                                                width: '100%',
                                                            }}
                                                            placeholder="Select shipping charge options"
                                                            data={[]}
                                                        />
                                                    </Box>
                                                )}
                                            </Stack>

                                            {/* Default Shipping Costs Option */}
                                            <Stack spacing="sm">
                                                <Radio
                                                    value="default-costs"
                                                    label={
                                                        <Box>
                                                            <Text weight={500}>
                                                                Default Shipping
                                                                Costs
                                                            </Text>
                                                            <Text
                                                                size="sm"
                                                                c="dimmed"
                                                                ml="lg"
                                                            >
                                                                Set default
                                                                shipping costs
                                                                for your orders
                                                            </Text>
                                                        </Box>
                                                    }
                                                />

                                                {selectedShippingOption ===
                                                    'default-costs' && (
                                                    <Box ml="lg" mt="md">
                                                        <Stack spacing="md">
                                                            <Paper
                                                                p="md"
                                                                radius="md"
                                                                sx={(
                                                                    theme,
                                                                ) => ({
                                                                    backgroundColor:
                                                                        theme
                                                                            .colors
                                                                            .blue[0],
                                                                })}
                                                            >
                                                                <Group spacing="xs">
                                                                    <IconInfoCircle
                                                                        size={
                                                                            16
                                                                        }
                                                                        color="blue"
                                                                    />
                                                                    <Text c="dimmed">
                                                                        If you
                                                                        use
                                                                        multiple
                                                                        default
                                                                        shipping
                                                                        options,
                                                                        they
                                                                        will be
                                                                        prioritized
                                                                        according
                                                                        to the
                                                                        order
                                                                        below.
                                                                    </Text>
                                                                </Group>
                                                            </Paper>

                                                            <Group position="apart">
                                                                <TextInput
                                                                    placeholder="Search shipping profiles..."
                                                                    style={{
                                                                        width: 300,
                                                                    }}
                                                                />
                                                                <Group>
                                                                    <Button
                                                                        leftIcon={
                                                                            <IconUpload
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        }
                                                                    >
                                                                        Import
                                                                        Costs
                                                                    </Button>
                                                                    <Button
                                                                        variant="filled"
                                                                        leftIcon={
                                                                            <IconPlus
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        }
                                                                        onClick={
                                                                            handleAddShippingProfile
                                                                        }
                                                                    >
                                                                        Create a
                                                                        Shipping
                                                                        Profile
                                                                    </Button>
                                                                </Group>
                                                            </Group>
                                                        </Stack>
                                                    </Box>
                                                )}
                                            </Stack>
                                        </Stack>
                                    </Radio.Group>
                                </Stack>
                            </Box>
                        </Accordion.Panel>
                    </Accordion.Item>

                    {/* Gateway Costs */}
                    <Accordion.Item value="gatewayCosts">
                        <Accordion.Control icon={<IconCreditCard size={20} />}>
                            <Group position="apart">
                                <Box>
                                    <Text weight={500}>Gateway Costs</Text>
                                    <Text size="sm" c="dimmed">
                                        Set up payment processing fees
                                    </Text>
                                </Box>
                                <IconCheck size={20} color="green" />
                            </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Box p="md">
                                <Stack spacing="md">
                                    <Group
                                        position="apart"
                                        align="center"
                                        mb="sm"
                                    >
                                        <Box>
                                            <Title order={5} mb="xs">
                                                Payment Gateway Costs
                                            </Title>
                                            <Text c="dimmed">
                                                Configure costs for each payment
                                                gateway
                                            </Text>
                                        </Box>
                                        <Button
                                            leftIcon={<IconPlus size={16} />}
                                            onClick={() =>
                                                setIsAddPaymentGatewayModalOpen(
                                                    true,
                                                )
                                            }
                                        >
                                            Add Payment Provider
                                        </Button>
                                    </Group>

                                    <Table>
                                        <thead>
                                            <tr>
                                                <th>Payment Gateway Name</th>
                                                <th>Cost</th>
                                                <th>Fee</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paymentGateways.map((record) => (
                                                <tr key={record.gatewayId}>
                                                    <td>
                                                        {record.gatewayName}
                                                    </td>
                                                    <td>
                                                        {record.isShopifyPayments ? (
                                                            <Group spacing="xs">
                                                                <IconInfoCircle
                                                                    className="text-gray-400"
                                                                    size={16}
                                                                />
                                                                <Text c="dimmed">
                                                                    {
                                                                        record.fixedFee
                                                                    }
                                                                </Text>
                                                            </Group>
                                                        ) : (
                                                            <Group spacing="xs">
                                                                <span>%</span>
                                                                <NumberInput
                                                                    value={Number(
                                                                        record.fixedFee,
                                                                    )}
                                                                    style={{
                                                                        width: '100%',
                                                                    }}
                                                                    hideControls
                                                                    onChange={(
                                                                        newValue,
                                                                    ) => {
                                                                        const updatedGateways =
                                                                            paymentGateways.map(
                                                                                (
                                                                                    gateway,
                                                                                ) =>
                                                                                    gateway.gatewayId ===
                                                                                    record.gatewayId
                                                                                        ? {
                                                                                              ...gateway,
                                                                                              fixedFee:
                                                                                                  newValue ??
                                                                                                  0,
                                                                                          }
                                                                                        : gateway,
                                                                            ) as PaymentGatewaySettings[];
                                                                        setPaymentGateways(
                                                                            updatedGateways,
                                                                        );
                                                                    }}
                                                                />
                                                            </Group>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {!record.isShopifyPayments && (
                                                            <Group spacing="xs">
                                                                <span>$</span>
                                                                <NumberInput
                                                                    value={
                                                                        record.percentageFee
                                                                    }
                                                                    style={{
                                                                        width: '100%',
                                                                    }}
                                                                    hideControls
                                                                    onChange={(
                                                                        newValue,
                                                                    ) => {
                                                                        const updatedGateways =
                                                                            paymentGateways.map(
                                                                                (
                                                                                    gateway,
                                                                                ) =>
                                                                                    gateway.gatewayId ===
                                                                                    record.gatewayId
                                                                                        ? {
                                                                                              ...gateway,
                                                                                              percentageFee:
                                                                                                  newValue ??
                                                                                                  0,
                                                                                          }
                                                                                        : gateway,
                                                                            ) as PaymentGatewaySettings[];
                                                                        setPaymentGateways(
                                                                            updatedGateways,
                                                                        );
                                                                    }}
                                                                />
                                                            </Group>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {!record.isShopifyPayments && (
                                                            <Group spacing="xs">
                                                                <Button
                                                                    variant="subtle"
                                                                    leftIcon={
                                                                        <IconTrash
                                                                            size={
                                                                                16
                                                                            }
                                                                        />
                                                                    }
                                                                    color="red"
                                                                />
                                                                <Button
                                                                    variant="filled"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleUpdatePaymentGateway(
                                                                            record,
                                                                        )
                                                                    }
                                                                >
                                                                    Save
                                                                </Button>
                                                            </Group>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </Stack>
                            </Box>
                        </Accordion.Panel>
                    </Accordion.Item>

                    {/* Custom Expenses */}
                    <Accordion.Item value="customExpenses">
                        <Accordion.Control icon={<IconCurrency size={20} />}>
                            <Group position="apart">
                                <Box>
                                    <Text weight={500}>Custom Expenses</Text>
                                    <Text size="sm" c="dimmed">
                                        Add and manage additional business
                                        expenses
                                    </Text>
                                </Box>
                                <IconCheck size={20} color="green" />
                            </Group>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Box p="md">
                                <Stack spacing="md">
                                    <Text mb="sm">
                                        There is a maximum limit of 5000 custom
                                        expenses per shop
                                    </Text>

                                    <Group spacing="sm" mb="md">
                                        <Button>Add Fixed Expense</Button>
                                        <Button>Add Variable Expense</Button>
                                        <Button>Export CSV</Button>
                                        <Button>
                                            Import Fixed Expenses from Google
                                            Sheets
                                        </Button>
                                    </Group>

                                    <Group align="center" spacing="sm" mb="md">
                                        <IconSettings size={16} color="gray" />
                                        <Checkbox
                                            checked={includeInPixel}
                                            onChange={(e) =>
                                                setIncludeInPixel(
                                                    e.target.checked,
                                                )
                                            }
                                            label="Include in pixel"
                                        />
                                        <Text size="sm" c="dimmed">
                                            Include custom ad spend in all
                                            calculations on the pixel page
                                        </Text>
                                    </Group>

                                    <Group spacing="md" mb="lg">
                                        <TextInput
                                            placeholder="Filter by spend name"
                                            style={{ width: 300 }}
                                        />
                                        <Select
                                            defaultValue="All"
                                            style={{ width: 200 }}
                                            data={[
                                                { value: 'all', label: 'All' },
                                                {
                                                    value: 'fixed',
                                                    label: 'Fixed',
                                                },
                                                {
                                                    value: 'variable',
                                                    label: 'Variable',
                                                },
                                            ]}
                                        />
                                    </Group>

                                    <Box>
                                        <Title order={5} mb="md">
                                            Variable Expenses
                                        </Title>
                                        <Table>
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th>Name</th>
                                                    <th>Metric</th>
                                                    <th>Percent</th>
                                                    <th>Start Date</th>
                                                    <th>End Date</th>
                                                    <th>Ad Spend</th>
                                                    <th></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {variableExpenses.map(
                                                    (expense) => (
                                                        <tr key={expense.key}>
                                                            <td>
                                                                {
                                                                    expense.category
                                                                }
                                                            </td>
                                                            <td>
                                                                {expense.name}
                                                            </td>
                                                            <td>
                                                                <Select
                                                                    defaultValue={
                                                                        expense.metric
                                                                    }
                                                                    style={{
                                                                        width: '100%',
                                                                    }}
                                                                    data={[
                                                                        {
                                                                            value: 'total_revenue',
                                                                            label: 'Total Revenue',
                                                                        },
                                                                        {
                                                                            value: 'net_sales',
                                                                            label: 'Net Sales',
                                                                        },
                                                                        {
                                                                            value: 'gross_profit',
                                                                            label: 'Gross Profit',
                                                                        },
                                                                    ]}
                                                                />
                                                            </td>
                                                            <td>
                                                                <NumberInput
                                                                    value={
                                                                        expense.percent
                                                                    }
                                                                    formatter={(
                                                                        value,
                                                                    ) =>
                                                                        `${value}%`
                                                                    }
                                                                    parser={(
                                                                        value,
                                                                    ) =>
                                                                        value!.replace(
                                                                            '%',
                                                                            '',
                                                                        )
                                                                    }
                                                                    style={{
                                                                        width: '100%',
                                                                    }}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Select
                                                                    defaultValue={
                                                                        expense.startDate
                                                                    }
                                                                    style={{
                                                                        width: '100%',
                                                                    }}
                                                                    data={[
                                                                        {
                                                                            value: '2023-12-31',
                                                                            label: 'Dec 31, 2023',
                                                                        },
                                                                    ]}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Select
                                                                    defaultValue={
                                                                        expense.endDate
                                                                    }
                                                                    style={{
                                                                        width: '100%',
                                                                    }}
                                                                    data={[
                                                                        {
                                                                            value: 'no_end_date',
                                                                            label: 'No end date',
                                                                        },
                                                                    ]}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Checkbox
                                                                    checked={
                                                                        expense.adSpend
                                                                    }
                                                                />
                                                            </td>
                                                            <td>
                                                                <Group spacing="xs">
                                                                    <Button
                                                                        variant="subtle"
                                                                        leftIcon={
                                                                            <IconEdit
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        }
                                                                        color="blue"
                                                                    />
                                                                    <Button
                                                                        variant="subtle"
                                                                        leftIcon={
                                                                            <IconTrash
                                                                                size={
                                                                                    16
                                                                                }
                                                                            />
                                                                        }
                                                                        color="red"
                                                                    />
                                                                </Group>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                            </tbody>
                                        </Table>
                                    </Box>
                                </Stack>
                            </Box>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>

                <Group position="right">
                    <Button
                        loading={isSavingChanges}
                        onClick={handleSaveChanges}
                        size="md"
                    >
                        Save Changes
                    </Button>
                </Group>
            </Stack>

            <AddShippingProfileModal
                opened={isModalOpen}
                setIsModalOpen={setIsModalOpen}
                onClose={() => setIsModalOpen(false)}
                refetchShippingProfiles={fetchShippingProfiles}
                existingProfile={editingProfile || undefined}
                isEditMode={isEditMode}
            />
            <AddPaymentGatewayModal
                refetchPaymentGateways={fetchPaymentGateways}
                opened={isAddPaymentGatewayModalOpen}
                onClose={() => setIsAddPaymentGatewayModalOpen(false)}
            />
        </Box>
    );
};

export default CostSettings;
