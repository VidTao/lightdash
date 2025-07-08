import { Box, Checkbox, Paper, ScrollArea, Stack, Text } from '@mantine/core';
import { useState } from 'react';
import { AdPlatformAccountInfo } from '../models/interfaces';

interface TreeNode {
    key: string;
    title: string;
    children?: TreeNode[];
}

interface Props {
    data: TreeNode[];
    onSelectedAccountsChange: (
        selectedAccounts: AdPlatformAccountInfo[],
    ) => void;
}

const TreeItem = ({
    node,
    checkedKeys,
    onCheck,
    level = 0,
}: {
    node: TreeNode;
    checkedKeys: string[];
    onCheck: (key: string, checked: boolean) => void;
    level?: number;
}) => {
    const isChecked = checkedKeys.includes(node.key);
    const hasChildren = node.children && node.children.length > 0;
    const isCheckable = !hasChildren; // Only checkable if it has no children

    return (
        <Box>
            <Box
                sx={(theme) => ({
                    padding: theme.spacing.xs,
                    marginLeft: `${level * 24}px`,
                    borderRadius: theme.radius.sm,
                    '&:hover': {
                        backgroundColor: theme.colors.gray[0],
                    },
                })}
            >
                <Checkbox
                    checked={isChecked}
                    onChange={(event) =>
                        onCheck(node.key, event.currentTarget.checked)
                    }
                    label={
                        <Text size="sm" weight={hasChildren ? 600 : 400}>
                            {node.title}
                        </Text>
                    }
                    disabled={!isCheckable}
                    styles={(theme) => ({
                        label: {
                            cursor: isCheckable ? 'pointer' : 'default',
                            color: hasChildren
                                ? theme.colors.gray[8]
                                : theme.colors.gray[7],
                        },
                    })}
                />
            </Box>
            {hasChildren && (
                <Stack spacing={0} mt={4}>
                    {node.children?.map((child) => (
                        <TreeItem
                            key={child.key}
                            node={child}
                            checkedKeys={checkedKeys}
                            onCheck={onCheck}
                            level={level + 1}
                        />
                    ))}
                </Stack>
            )}
        </Box>
    );
};

const AccountsSelect = ({ data, onSelectedAccountsChange }: Props) => {
    const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

    const handleCheck = (key: string, checked: boolean) => {
        const newCheckedKeys = checked
            ? [...checkedKeys, key]
            : checkedKeys.filter((k) => k !== key);

        setCheckedKeys(newCheckedKeys);

        // Convert checked nodes to AdPlatformAccountInfo array
        const selectedAccounts: AdPlatformAccountInfo[] = findSelectedAccounts(
            data,
            newCheckedKeys,
        );
        onSelectedAccountsChange(selectedAccounts);
    };

    const findSelectedAccounts = (
        nodes: TreeNode[],
        keys: string[],
    ): AdPlatformAccountInfo[] => {
        const accounts: AdPlatformAccountInfo[] = [];

        const traverse = (node: TreeNode) => {
            // Only include leaf nodes in selected accounts
            if (
                keys.includes(node.key) &&
                (!node.children || node.children.length === 0)
            ) {
                accounts.push({
                    accountId: node.key,
                    accountName: node.title,
                });
            }
            node.children?.forEach(traverse);
        };

        nodes.forEach(traverse);
        return accounts;
    };

    return (
        <Paper withBorder p="xs">
            <ScrollArea h={300}>
                <Stack spacing={0}>
                    {data.map((node) => (
                        <TreeItem
                            key={node.key}
                            node={node}
                            checkedKeys={checkedKeys}
                            onCheck={handleCheck}
                        />
                    ))}
                </Stack>
            </ScrollArea>
        </Paper>
    );
};

export default AccountsSelect;
