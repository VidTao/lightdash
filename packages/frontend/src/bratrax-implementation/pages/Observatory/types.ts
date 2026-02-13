import type { Edge, Node } from '@xyflow/react';

export type NodeKind = 'source' | 'stream' | 'flatten' | 'dim' | 'lightdash';

export type OntologyNodeData = {
    label: string;
    kind: NodeKind;
    details: Record<string, unknown>;
};

export type OntologyNode = Node<OntologyNodeData>;

export type OntologyEdge = Edge;

export type OntologyGraphData = {
    nodes: Array<{
        id: string;
        kind: NodeKind;
        label: string;
        details: Record<string, unknown>;
    }>;
    edges: Array<{
        source: string;
        target: string;
    }>;
};

export const NODE_KIND_COLORS: Record<
    NodeKind,
    { bg: string; border: string; text: string }
> = {
    source: {
        bg: 'var(--mantine-color-blue-0)',
        border: 'var(--mantine-color-blue-4)',
        text: 'var(--mantine-color-blue-7)',
    },
    stream: {
        bg: 'var(--mantine-color-teal-0)',
        border: 'var(--mantine-color-teal-4)',
        text: 'var(--mantine-color-teal-7)',
    },
    flatten: {
        bg: 'var(--mantine-color-yellow-0)',
        border: 'var(--mantine-color-yellow-4)',
        text: 'var(--mantine-color-yellow-8)',
    },
    dim: {
        bg: 'var(--mantine-color-green-0)',
        border: 'var(--mantine-color-green-4)',
        text: 'var(--mantine-color-green-7)',
    },
    lightdash: {
        bg: 'var(--mantine-color-violet-0)',
        border: 'var(--mantine-color-violet-4)',
        text: 'var(--mantine-color-violet-7)',
    },
};

export const NODE_KIND_LABELS: Record<NodeKind, string> = {
    source: 'Source',
    stream: 'Stream',
    flatten: 'Flatten',
    dim: 'Dimension',
    lightdash: 'Dashboard',
};
