import { Box, MantineProvider, rem } from '@mantine/core';
import React, { useCallback, useEffect, useMemo } from 'react';

import { type FuzzyMatches } from '../../../hooks/useFuzzySearch';
import TreeItem from './TreeItem';
import { type NestableItem } from './types';
import { type FuzzyFilteredItem } from './useFuzzyTreeSearch';
import { convertNestableListToTree } from './utils';

import classes from './Tree.module.css';

type Data<T> = T | FuzzyFilteredItem<T> | FuzzyFilteredItem<FuzzyMatches<T>>;

type Props = {
    withRootSelectable?: boolean;
    topLevelLabel: string;
    isExpanded: boolean;
    data: Data<NestableItem>[];
    value: string | null;
    onChange: (selectedUuid: string | null) => void;
};

const Tree: React.FC<Props> = ({
    withRootSelectable = true,
    topLevelLabel,
    isExpanded,
    value,
    data,
    onChange,
}) => {
    const treeData = useMemo(() => convertNestableListToTree(data), [data]);

    const item = useMemo(() => {
        if (!value) return null;
        return data.find((i) => i.uuid === value) ?? null;
    }, [value, data]);

    const handleSelect = useCallback(
        (uuid: string | null) => {
            onChange(uuid);
        },
        [onChange],
    );

    return (
        <MantineProvider>
            <Box px="sm" py="xs">
                {withRootSelectable && (
                    <TreeItem
                        withRootSelectable={withRootSelectable}
                        selected={!value}
                        label={topLevelLabel}
                        isRoot={true}
                        onClick={() => handleSelect(null)}
                    />
                )}
                <Box ml={rem(6)} pl={rem(13.5)}>
                    {treeData.map((node) => (
                        <TreeItem
                            key={node.uuid}
                            selected={node.uuid === value}
                            label={node.label || node.name}
                            hasChildren={node.children?.length > 0}
                            onClick={() => handleSelect(node.uuid)}
                            expanded={isExpanded}
                            matchHighlights={
                                '_fuzzyMatches' in node
                                    ? node._fuzzyMatches
                                    : []
                            }
                        />
                    ))}
                </Box>
            </Box>
        </MantineProvider>
    );
};

export default Tree;
