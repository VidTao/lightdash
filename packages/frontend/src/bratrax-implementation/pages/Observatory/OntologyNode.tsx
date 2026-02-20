import { Group, Stack, Text } from '@mantine/core';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { type FC } from 'react';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './Observatory.module.css';
import { NODE_KIND_COLORS, NODE_KIND_LABELS, type OntologyNode } from './types';

const OntologyNodeComponent: FC<NodeProps<OntologyNode>> = ({
    data,
    selected,
}) => {
    const colors = NODE_KIND_COLORS[data.kind];

    return (
        <>
            <Handle type="target" position={Position.Left} />
            <div
                className={`${styles.nodeBase} ${selected ? styles.nodeSelected : ''}`}
                style={{
                    backgroundColor: colors.bg,
                    borderColor: colors.border,
                }}
            >
                <Stack spacing={4}>
                    <Group spacing={6}>
                        <span
                            className={styles.kindBadge}
                            style={{ color: colors.text }}
                        >
                            {NODE_KIND_LABELS[data.kind]}
                        </span>
                    </Group>
                    <Text
                        size="sm"
                        weight={600}
                        style={{
                            color: colors.text,
                            wordBreak: 'break-word',
                        }}
                    >
                        {data.label}
                    </Text>
                </Stack>
            </div>
            <Handle type="source" position={Position.Right} />
        </>
    );
};

export default OntologyNodeComponent;
