import {
    ActionIcon,
    Box,
    Button,
    Card,
    Collapse,
    Group,
    Input,
    Select,
    Stack,
    Switch,
    Text,
    TextInput,
    Title,
} from '@mantine/core';
import {
    IconChevronDown,
    IconChevronUp,
    IconFilter,
    IconPlus,
    IconSearch,
    IconTrash,
} from '@tabler/icons-react';
import React, { useState } from 'react';

interface RuleCondition {
    type: string;
    operator: string;
    value: string;
    connector?: string;
}

interface TrafficRule {
    id: string;
    name: string;
    enabled: boolean;
    conditions?: RuleCondition[];
    action?: string;
    channel?: string;
    expanded: boolean;
}

interface RuleAction {
    type: 'Exclude / Ignore' | 'Assign to Channel';
    channel?: string;
}

interface BratraxRule {
    id: string;
    name: string;
    enabled: boolean;
    description?: string;
    conditions?: RuleCondition[];
    action?: string;
    channel?: string;
    expanded?: boolean;
}

const paymentPlatformsConditions: RuleCondition[] = [
    { type: 'Referrer', operator: 'Contains', value: 'pay.klarna.com' },
    { type: 'Referrer', operator: 'Contains', value: 'pay.google.com' },
    { type: 'Referrer', operator: 'Contains', value: 'portal.afterpay.com' },
    { type: 'Referrer', operator: 'Contains', value: 'pay.shopify.com' },
    { type: 'Referrer', operator: 'Contains', value: 'checkout.shopify.com' },
    { type: 'Referrer', operator: 'Contains', value: 'api.checkout.com' },
    { type: 'Referrer', operator: 'Contains', value: 'global-e.com' },
    { type: 'Referrer', operator: 'Contains', value: 'pay.skrill.com' },
];

const shopPaymentConditions: RuleCondition[] = [
    { type: 'Page URL', operator: 'Contains', value: 'thank_you' },
    {
        type: 'Referrer',
        operator: 'Contains',
        value: 'shop.app',
        connector: 'And',
    },
];

const paypalPaymentConditions: RuleCondition[] = [
    { type: 'Page URL', operator: 'Contains', value: 'checkouts' },
    {
        type: 'Referrer',
        operator: 'Contains',
        value: 'paypal.com',
        connector: 'And',
    },
];

const klaviyoConditions: RuleCondition[] = [
    { type: 'Page URL', operator: 'Contains', value: '_kx=' },
    { type: 'Page URL', operator: 'Contains', value: '_ke=', connector: 'Or' },
];

const smsBumpConditions: RuleCondition[] = [
    { type: 'Page URL', operator: 'Contains', value: 'wtbap=' },
];

const looxConditions: RuleCondition[] = [
    { type: 'Page URL', operator: 'Contains', value: 'ref=loox' },
];

const activeCampaignConditions: RuleCondition[] = [
    { type: 'Page URL', operator: 'Contains', value: 'vgo_ee=' },
];

const hubSpotConditions: RuleCondition[] = [
    { type: 'Page URL', operator: 'Contains', value: '_hsenc=' },
];

const removeGoogleChromeConditions: RuleCondition[] = [
    { type: 'Referrer', operator: 'Contains', value: 'google.com/url?q=' },
];

const defaultBratraxRules: BratraxRule[] = [
    {
        id: '1',
        name: 'Exclude Payment Platforms',
        enabled: true,
        conditions: paymentPlatformsConditions,
        action: 'Exclude / Ignore',
        expanded: false,
    },
    {
        id: '2',
        name: 'Exclude Shop Payment',
        enabled: true,
        conditions: shopPaymentConditions,
        action: 'Exclude / Ignore',
        expanded: false,
    },
    {
        id: '3',
        name: 'Exclude PayPal Payment',
        enabled: true,
        conditions: paypalPaymentConditions,
        action: 'Exclude / Ignore',
        expanded: false,
    },
    {
        id: '4',
        name: "Classify '_kx' url parameter as Klaviyo",
        enabled: true,
        conditions: klaviyoConditions,
        action: 'Assign to Channel',
        channel: 'Klaviyo',
        expanded: false,
    },
    {
        id: '5',
        name: 'SMS Bump',
        enabled: true,
        conditions: smsBumpConditions,
        action: 'Assign to Channel',
        channel: 'smsbump',
        expanded: false,
    },
    {
        id: '6',
        name: 'Loox',
        enabled: true,
        conditions: looxConditions,
        action: 'Assign to Channel',
        channel: 'Loox',
        expanded: false,
    },
    {
        id: '7',
        name: 'ActiveCampaign',
        enabled: true,
        conditions: activeCampaignConditions,
        action: 'Assign to Channel',
        channel: 'ActiveCampaign',
        expanded: false,
    },
    {
        id: '8',
        name: 'HubSpot',
        enabled: true,
        conditions: hubSpotConditions,
        action: 'Assign to Channel',
        channel: 'HubSpot',
        expanded: false,
    },
    {
        id: '9',
        name: 'Remove Google Chrome Referral (not related to Google Search)',
        enabled: true,
        conditions: removeGoogleChromeConditions,
        action: 'Exclude / Ignore',
        expanded: false,
    },
];

const Rules: React.FC = () => {
    const [trafficRules, setTrafficRules] = useState<TrafficRule[]>([
        { id: '1', name: 'Rule 1', enabled: true, expanded: false },
    ]);
    const [bratraxRules, setBratraxRules] =
        useState<BratraxRule[]>(defaultBratraxRules);

    const handleAddRule = () => {
        const newRule: TrafficRule = {
            id: String(trafficRules.length + 1),
            name: `Rule ${trafficRules.length + 1}`,
            enabled: true,
            expanded: true,
            conditions: [
                {
                    type: 'Page URL',
                    operator: 'Contains',
                    value: '<key=value>',
                },
            ],
            action: 'Exclude / Ignore',
        };
        setTrafficRules([...trafficRules, newRule]);
    };

    const handleToggleRule =
        (id: string, type: 'traffic' | 'bratrax') => (checked: boolean) => {
            if (type === 'traffic') {
                setTrafficRules((rules) =>
                    rules.map((rule) =>
                        rule.id === id ? { ...rule, enabled: checked } : rule,
                    ),
                );
            } else {
                setBratraxRules((rules) =>
                    rules.map((rule) =>
                        rule.id === id ? { ...rule, enabled: checked } : rule,
                    ),
                );
            }
        };

    const handleExpandTrafficRule = (id: string) => {
        setTrafficRules((rules) =>
            rules.map((rule) =>
                rule.id === id ? { ...rule, expanded: !rule.expanded } : rule,
            ),
        );
    };

    const handleExpandRule = (id: string) => {
        setBratraxRules((rules) =>
            rules.map((rule) =>
                rule.id === id ? { ...rule, expanded: !rule.expanded } : rule,
            ),
        );
    };

    const handleAddCondition = (ruleId: string) => {
        setTrafficRules((rules) =>
            rules.map((rule) =>
                rule.id === ruleId
                    ? {
                          ...rule,
                          conditions: [
                              ...(rule.conditions || []),
                              {
                                  type: 'Page URL',
                                  operator: 'Contains',
                                  value: '<key=value>',
                                  connector: 'And',
                              },
                          ],
                      }
                    : rule,
            ),
        );
    };

    const handleUpdateCondition = (
        ruleId: string,
        index: number,
        field: keyof RuleCondition,
        value: string,
    ) => {
        setTrafficRules((rules) =>
            rules.map((rule) =>
                rule.id === ruleId
                    ? {
                          ...rule,
                          conditions: rule.conditions?.map((condition, i) =>
                              i === index
                                  ? { ...condition, [field]: value }
                                  : condition,
                          ),
                      }
                    : rule,
            ),
        );
    };

    const handleSaveRule = (ruleId: string) => {
        setTrafficRules((rules) =>
            rules.map((rule) =>
                rule.id === ruleId ? { ...rule, expanded: false } : rule,
            ),
        );
    };

    const handleDeleteRule = (ruleId: string) => {
        setTrafficRules((rules) => rules.filter((rule) => rule.id !== ruleId));
    };

    const renderTrafficRuleDetails = (rule: TrafficRule) => {
        if (!rule.expanded) return null;

        return (
            <Box mt="md">
                <Stack spacing="md">
                    <Box>
                        <Text weight={600} mb="xs">
                            Condition
                        </Text>
                        {rule.conditions?.map((condition, index) => (
                            <Group
                                key={index}
                                align="center"
                                spacing="xs"
                                mb="xs"
                            >
                                {index > 0 && (
                                    <Select
                                        value={condition.connector || 'And'}
                                        data={[
                                            { value: 'Or', label: 'Or' },
                                            { value: 'And', label: 'And' },
                                        ]}
                                        onChange={(value) =>
                                            handleUpdateCondition(
                                                rule.id,
                                                index,
                                                'connector',
                                                value || 'And',
                                            )
                                        }
                                        style={{ width: 100 }}
                                    />
                                )}
                                <Select
                                    value={condition.type}
                                    data={[
                                        {
                                            value: 'Page URL',
                                            label: 'Page URL',
                                        },
                                        {
                                            value: 'Referrer',
                                            label: 'Referrer',
                                        },
                                        { value: 'URL', label: 'URL' },
                                    ]}
                                    onChange={(value) =>
                                        handleUpdateCondition(
                                            rule.id,
                                            index,
                                            'type',
                                            value || '',
                                        )
                                    }
                                    style={{ width: 200 }}
                                />
                                <Select
                                    value={condition.operator}
                                    data={[
                                        {
                                            value: 'Contains',
                                            label: 'Contains',
                                        },
                                        { value: 'Equals', label: 'Equals' },
                                    ]}
                                    onChange={(value) =>
                                        handleUpdateCondition(
                                            rule.id,
                                            index,
                                            'operator',
                                            value || '',
                                        )
                                    }
                                    style={{ width: 200 }}
                                />
                                <TextInput
                                    value={condition.value}
                                    onChange={(e) =>
                                        handleUpdateCondition(
                                            rule.id,
                                            index,
                                            'value',
                                            e.target.value,
                                        )
                                    }
                                    style={{ width: 300 }}
                                />
                            </Group>
                        ))}
                        <Button
                            variant="subtle"
                            onClick={() => handleAddCondition(rule.id)}
                            leftIcon={<IconPlus size={16} />}
                            mt="xs"
                        >
                            Add Condition
                        </Button>
                    </Box>

                    <Box>
                        <Text weight={600} mb="xs">
                            Action
                        </Text>
                        <Group spacing="xs">
                            <Select
                                value={rule.action}
                                data={[
                                    {
                                        value: 'Exclude / Ignore',
                                        label: 'Exclude / Ignore',
                                    },
                                    {
                                        value: 'Assign to Channel',
                                        label: 'Assign to Channel',
                                    },
                                ]}
                                onChange={(value) =>
                                    setTrafficRules((rules) =>
                                        rules.map((r) =>
                                            r.id === rule.id
                                                ? { ...r, action: value || '' }
                                                : r,
                                        ),
                                    )
                                }
                                style={{ width: 200 }}
                            />
                            {rule.action === 'Assign to Channel' &&
                                rule.channel && (
                                    <TextInput
                                        value={rule.channel}
                                        onChange={(e) =>
                                            setTrafficRules((rules) =>
                                                rules.map((r) =>
                                                    r.id === rule.id
                                                        ? {
                                                              ...r,
                                                              channel:
                                                                  e.target
                                                                      .value,
                                                          }
                                                        : r,
                                                ),
                                            )
                                        }
                                        style={{ width: 200 }}
                                    />
                                )}
                        </Group>
                    </Box>

                    <Box>
                        <Button onClick={() => handleSaveRule(rule.id)}>
                            Save
                        </Button>
                    </Box>
                </Stack>
            </Box>
        );
    };

    const renderRuleDetails = (rule: BratraxRule) => {
        if (!rule.expanded) return null;

        return (
            <Box mt="md">
                <Stack spacing="md">
                    <Box>
                        <Text weight={600} mb="xs">
                            Condition
                        </Text>
                        {rule.conditions?.map((condition, index) => (
                            <Group
                                key={index}
                                align="center"
                                spacing="xs"
                                mb="xs"
                            >
                                {index > 0 && (
                                    <Select
                                        value={condition.connector || 'Or'}
                                        data={[
                                            { value: 'Or', label: 'Or' },
                                            { value: 'And', label: 'And' },
                                        ]}
                                        style={{ width: 100 }}
                                    />
                                )}
                                <Select
                                    value={condition.type}
                                    data={[
                                        {
                                            value: 'Page URL',
                                            label: 'Page URL',
                                        },
                                        {
                                            value: 'Referrer',
                                            label: 'Referrer',
                                        },
                                        { value: 'URL', label: 'URL' },
                                    ]}
                                    style={{ width: 200 }}
                                />
                                <Select
                                    value={condition.operator}
                                    data={[
                                        {
                                            value: 'Contains',
                                            label: 'Contains',
                                        },
                                        { value: 'Equals', label: 'Equals' },
                                    ]}
                                    style={{ width: 200 }}
                                />
                                <TextInput
                                    value={condition.value}
                                    style={{ width: 300 }}
                                />
                            </Group>
                        ))}
                    </Box>

                    <Box>
                        <Text weight={600} mb="xs">
                            Action
                        </Text>
                        <Group spacing="xs">
                            <Select
                                value={rule.action}
                                data={[
                                    {
                                        value: 'Exclude / Ignore',
                                        label: 'Exclude / Ignore',
                                    },
                                    {
                                        value: 'Assign to Channel',
                                        label: 'Assign to Channel',
                                    },
                                ]}
                                style={{ width: 200 }}
                            />
                            {rule.action === 'Assign to Channel' &&
                                rule.channel && (
                                    <TextInput
                                        value={rule.channel}
                                        style={{ width: 200 }}
                                    />
                                )}
                        </Group>
                    </Box>
                </Stack>
            </Box>
        );
    };

    return (
        <Box p="xl">
            {/* Traffic Rules Section */}
            <Stack mb="xl">
                <Group position="apart" align="center">
                    <Title order={4}>Traffic Rules</Title>
                    <Button
                        leftIcon={<IconPlus size={16} />}
                        onClick={handleAddRule}
                    >
                        Add Rule
                    </Button>
                </Group>
                <Group align="center" spacing="md">
                    <TextInput
                        icon={<IconSearch size={16} />}
                        placeholder="Filter traffic rules"
                        sx={{ maxWidth: '400px', flex: 1 }}
                    />
                    <Text component="a" href="#" variant="link" c="blue">
                        Learn more
                    </Text>
                </Group>

                <Stack spacing="md">
                    {trafficRules.map((rule) => (
                        <Card key={rule.id} withBorder padding="md">
                            <Group position="apart">
                                <Group>
                                    <IconFilter size={20} color="gray" />
                                    <Switch
                                        checked={rule.enabled}
                                        onChange={(event) =>
                                            handleToggleRule(
                                                rule.id,
                                                'traffic',
                                            )(event.currentTarget.checked)
                                        }
                                    />
                                    <Text weight={500}>{rule.name}</Text>
                                </Group>
                                <Group spacing="xs">
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        onClick={() =>
                                            handleDeleteRule(rule.id)
                                        }
                                    >
                                        <IconTrash size={16} />
                                    </ActionIcon>
                                    <ActionIcon
                                        variant="subtle"
                                        onClick={() =>
                                            handleExpandTrafficRule(rule.id)
                                        }
                                    >
                                        {rule.expanded ? (
                                            <IconChevronUp size={16} />
                                        ) : (
                                            <IconChevronDown size={16} />
                                        )}
                                    </ActionIcon>
                                </Group>
                            </Group>
                            <Collapse in={rule.expanded}>
                                {renderTrafficRuleDetails(rule)}
                            </Collapse>
                        </Card>
                    ))}
                </Stack>
            </Stack>

            {/* Bratrax Rules Section */}
            <Stack>
                <Group align="center" spacing="xs">
                    <IconFilter size={24} />
                    <Title order={4}>Bratrax Rules</Title>
                    <Switch defaultChecked />
                </Group>
                <Text c="dimmed">
                    This is a default set of traffic rules we recommend for you.
                </Text>

                <Stack spacing="md">
                    {bratraxRules.map((rule) => (
                        <Card key={rule.id} withBorder padding="md">
                            <Group position="apart">
                                <Group>
                                    <Switch
                                        checked={rule.enabled}
                                        onChange={(event) =>
                                            handleToggleRule(
                                                rule.id,
                                                'bratrax',
                                            )(event.currentTarget.checked)
                                        }
                                    />
                                    <Text weight={500}>{rule.name}</Text>
                                </Group>
                                <ActionIcon
                                    variant="subtle"
                                    onClick={() => handleExpandRule(rule.id)}
                                >
                                    {rule.expanded ? (
                                        <IconChevronUp size={16} />
                                    ) : (
                                        <IconChevronDown size={16} />
                                    )}
                                </ActionIcon>
                            </Group>
                            <Collapse in={rule.expanded || false}>
                                {renderRuleDetails(rule)}
                            </Collapse>
                        </Card>
                    ))}
                </Stack>
            </Stack>
        </Box>
    );
};

export default Rules;
