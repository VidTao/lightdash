import {
    Accordion,
    Box,
    Button,
    Checkbox,
    Group,
    Input,
    Modal,
    NumberInput,
    Paper,
    Radio,
    Stack,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconChevronRight, IconSearch } from '@tabler/icons-react';
import React, { useEffect, useState } from 'react';
import { Region, ShippingProfile } from '../models/interfaces';
import { apiService } from '../services/api';

interface AddShippingProfileModalProps {
    opened: boolean; // Changed from isModalOpen to match Mantine
    setIsModalOpen: (value: boolean) => void;
    onClose: () => void; // Changed from setIsModalOpen
    refetchShippingProfiles: () => void;
    existingProfile?: ShippingProfile;
    isEditMode?: boolean;
}

const regions = [
    {
        label: 'North America',
        value: 'north-america',
        countries: ['United States', 'Canada', 'Mexico'],
    },
    {
        label: 'Europe',
        value: 'europe',
        countries: ['United Kingdom', 'France', 'Germany', 'Italy', 'Spain'],
    },
    {
        label: 'Asia',
        value: 'asia',
        countries: ['China', 'Japan', 'South Korea', 'India'],
    },
    {
        label: 'South America',
        value: 'south-america',
        countries: ['Brazil', 'Argentina', 'Chile', 'Colombia'],
    },
    {
        label: 'Oceania',
        value: 'oceania',
        countries: ['Australia', 'New Zealand'],
    },
    {
        label: 'Africa',
        value: 'africa',
        countries: ['South Africa', 'Nigeria', 'Kenya', 'Egypt'],
    },
    {
        label: 'Antarctica',
        value: 'antarctica',
        countries: ['Antarctica'],
    },
];

const AddShippingProfileModal = ({
    opened,
    setIsModalOpen,
    onClose,
    refetchShippingProfiles,
    existingProfile,
    isEditMode = false,
}: AddShippingProfileModalProps) => {
    const [selectedRegionType, setSelectedRegionType] = useState<
        'worldwide' | 'specific'
    >('specific');
    const [currentStep, setCurrentStep] = useState<'profile' | 'rates'>(
        'profile',
    );
    const [selectedRateType, setSelectedRateType] = useState<
        'fixed' | 'tiered'
    >('fixed');
    const [shippingRate, setShippingRate] = useState<number>(0);
    const [writeKey] = useState<string>('b6175fb3-dc45-45b6-9da8-5fc0f4d0e21d');
    const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState('');

    const form = useForm({
        initialValues: {
            profileName: '',
        },
        validate: {
            profileName: (value) =>
                !value ? 'Please enter profile name' : null,
        },
    });

    useEffect(() => {
        if (isEditMode && existingProfile) {
            form.setValues({
                profileName: existingProfile.profileName,
            });
            setSelectedRegionType(
                existingProfile.isWorldwide ? 'worldwide' : 'specific',
            );
            setSelectedRateType(existingProfile.rateType as 'fixed' | 'tiered');
            setShippingRate(existingProfile.shippingRate);
            if (existingProfile.regions) {
                setSelectedRegions(existingProfile.regions as Region[]);
            }
        }
    }, [isEditMode, existingProfile]);

    const handleModalCancel = () => {
        onClose();
        setCurrentStep('profile');
        setSelectedRateType('fixed');
        setShippingRate(0);
        setSelectedRegions([]);
        form.reset();
    };

    const handleModalNext = async () => {
        if (currentStep === 'profile') {
            const result = form.validate();
            if (!result.hasErrors) {
                setCurrentStep('rates');
            }
        } else {
            try {
                setIsLoading(true);
                const profileData = form.values;

                const profilePayload: ShippingProfile = {
                    profileId: existingProfile?.profileId || 0,
                    profileName: profileData.profileName,
                    writeKey,
                    isWorldwide: selectedRegionType === 'worldwide',
                    regions: selectedRegions,
                    rateType: selectedRateType,
                    shippingRate,
                    weightTiers: existingProfile?.weightTiers || [],
                    fulfillmentMethods:
                        existingProfile?.fulfillmentMethods || [],
                };

                if (isEditMode && existingProfile?.profileId) {
                    await apiService.updateShippingProfile(profilePayload);
                } else {
                    await apiService.insertShippingProfile(profilePayload);
                }

                refetchShippingProfiles();
                handleModalCancel();
            } catch (error) {
                console.error('Error saving shipping profile:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const filteredRegions = regions.filter((region) =>
        region.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <Modal
            opened={opened}
            onClose={handleModalCancel}
            title={
                isEditMode ? 'Edit Shipping Profile' : 'Create Shipping Profile'
            }
            size="lg"
        >
            <Stack spacing="md">
                {currentStep === 'profile' ? (
                    <form onSubmit={form.onSubmit(() => handleModalNext())}>
                        <Stack spacing="md">
                            <TextInput
                                label="Profile Name"
                                placeholder="Please enter profile name"
                                required
                                {...form.getInputProps('profileName')}
                            />

                            <Box mt="md">
                                <Radio.Group
                                    value={selectedRegionType}
                                    onChange={(
                                        value: 'worldwide' | 'specific',
                                    ) => setSelectedRegionType(value)}
                                    label="Region Type"
                                >
                                    <Stack mt="xs">
                                        <Radio
                                            value="worldwide"
                                            label="Worldwide"
                                        />
                                        <Radio
                                            value="specific"
                                            label="Specific countries/regions"
                                        />
                                    </Stack>
                                </Radio.Group>

                                {selectedRegionType === 'specific' && (
                                    <Box mt="md">
                                        <TextInput
                                            placeholder="Search countries"
                                            icon={<IconSearch size={16} />}
                                            value={searchQuery}
                                            onChange={(e) =>
                                                setSearchQuery(
                                                    e.currentTarget.value,
                                                )
                                            }
                                            mb="md"
                                        />

                                        <Stack spacing="xs">
                                            {filteredRegions.map((region) => (
                                                <Paper
                                                    key={region.value}
                                                    p="sm"
                                                    withBorder
                                                    sx={(theme) => ({
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                theme.colorScheme ===
                                                                'dark'
                                                                    ? theme
                                                                          .colors
                                                                          .dark[5]
                                                                    : theme
                                                                          .colors
                                                                          .gray[0],
                                                        },
                                                    })}
                                                    onClick={() => {
                                                        const isSelected =
                                                            selectedRegions.some(
                                                                (selected) =>
                                                                    selected.value ===
                                                                    region.value,
                                                            );
                                                        const newSelectedRegions =
                                                            isSelected
                                                                ? selectedRegions.filter(
                                                                      (value) =>
                                                                          value.value !==
                                                                          region.value,
                                                                  )
                                                                : [
                                                                      ...selectedRegions,
                                                                      region,
                                                                  ];
                                                        setSelectedRegions(
                                                            newSelectedRegions,
                                                        );
                                                    }}
                                                >
                                                    <Group position="apart">
                                                        <Group>
                                                            <Checkbox
                                                                checked={selectedRegions.some(
                                                                    (
                                                                        selected,
                                                                    ) =>
                                                                        selected.value ===
                                                                        region.value,
                                                                )}
                                                                onChange={() => {}}
                                                            />
                                                            <Text>
                                                                {region.label}
                                                            </Text>
                                                        </Group>
                                                        <IconChevronRight
                                                            size={16}
                                                        />
                                                    </Group>
                                                </Paper>
                                            ))}
                                        </Stack>
                                    </Box>
                                )}
                            </Box>
                        </Stack>
                    </form>
                ) : (
                    <Stack spacing="md">
                        <Title order={5}>Fulfillment Rates Settings</Title>

                        <Radio.Group
                            value={selectedRateType}
                            onChange={(value: 'fixed' | 'tiered') =>
                                setSelectedRateType(value)
                            }
                            label="Rate Type"
                        >
                            <Stack mt="xs">
                                <Radio value="fixed" label="Fixed Rate" />
                                <Radio
                                    value="tiered"
                                    label="Order weight-based tiered rates"
                                />
                            </Stack>
                        </Radio.Group>

                        <Box>
                            <Title order={5}>Shipping Rate</Title>
                            <Group spacing="xs" align="center">
                                <Text size="lg">$</Text>
                                <NumberInput
                                    value={shippingRate}
                                    onChange={(val) =>
                                        setShippingRate(val || 0)
                                    }
                                    min={0}
                                    precision={2}
                                    placeholder="Enter shipping rate"
                                    style={{ flex: 1 }}
                                />
                            </Group>
                        </Box>

                        <Accordion>
                            <Accordion.Item value="fulfillmentMethods">
                                <Accordion.Control>
                                    Fulfillment Methods
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Text>
                                        Configure fulfillment methods here
                                    </Text>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>

                        {selectedRateType === 'fixed' && shippingRate === 0 && (
                            <Text color="red" mt="sm">
                                Please enter a cost for all rates
                            </Text>
                        )}
                    </Stack>
                )}

                <Group position="right" mt="xl">
                    <Button variant="light" onClick={handleModalCancel}>
                        Cancel
                    </Button>
                    {currentStep === 'rates' && (
                        <Button
                            variant="light"
                            onClick={() => setCurrentStep('profile')}
                        >
                            Previous
                        </Button>
                    )}
                    <Button onClick={handleModalNext} loading={isLoading}>
                        {currentStep === 'profile'
                            ? 'Next'
                            : isEditMode
                            ? 'Update'
                            : 'Save'}
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default AddShippingProfileModal;
