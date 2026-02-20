import Dagre from '@dagrejs/dagre';
import {
    Background,
    MarkerType,
    ReactFlow,
    useEdgesState,
    useNodesInitialized,
    useNodesState,
    useReactFlow,
    type Edge,
    type EdgeTypes,
    type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type FC,
} from 'react';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './Observatory.module.css';
import OntologyEdgeComponent from './OntologyEdge';
import OntologyNodeComponent from './OntologyNode';
import {
    NODE_KIND_COLORS,
    NODE_KIND_LABELS,
    type NodeKind,
    type OntologyGraphData,
    type OntologyNode,
} from './types';

const edgeTypes: EdgeTypes = { default: OntologyEdgeComponent };
const nodeTypes: NodeTypes = { ontology: OntologyNodeComponent };

const getNodeLayout = (
    nodes: OntologyNode[],
    edges: Edge[],
): { nodes: OntologyNode[]; edges: Edge[] } => {
    const graph = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: 'LR', ranksep: 120, nodesep: 40 });

    edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
    nodes.forEach((node) =>
        graph.setNode(node.id, {
            ...node,
            width: node.measured?.width ?? 200,
            height: node.measured?.height ?? 60,
        }),
    );

    Dagre.layout(graph);

    const layoutedNodes = nodes.map<OntologyNode>((node) => {
        const position = graph.node(node.id);
        const x = position.x - (node.measured?.width ?? 200) / 2;
        const y = position.y - (node.measured?.height ?? 60) / 2;

        return {
            ...node,
            position: { x, y },
        };
    });

    return { nodes: layoutedNodes, edges };
};

type Props = {
    graphData: OntologyGraphData;
    onNodeSelect: (nodeId: string | null) => void;
};

const ObservatoryCanvas: FC<Props> = ({ graphData, onNodeSelect }) => {
    const { fitView } = useReactFlow();
    const nodesInitialized = useNodesInitialized();
    const [isLayoutReady, setIsLayoutReady] = useState(false);
    const layoutAppliedRef = useRef(false);

    const initialNodes = useMemo<OntologyNode[]>(
        () =>
            graphData.nodes.map((n) => ({
                id: n.id,
                type: 'ontology',
                position: { x: 0, y: 0 },
                data: {
                    label: n.label,
                    kind: n.kind,
                    details: n.details,
                },
            })),
        [graphData.nodes],
    );

    const initialEdges = useMemo<Edge[]>(
        () =>
            graphData.edges.map((e, i) => ({
                id: `e-${i}`,
                source: e.source,
                target: e.target,
                type: 'default',
                markerEnd: { type: MarkerType.ArrowClosed },
            })),
        [graphData.edges],
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, , onEdgesChange] = useEdgesState(initialEdges);

    useEffect(() => {
        if (nodesInitialized && !layoutAppliedRef.current) {
            const layout = getNodeLayout(nodes, edges);
            setNodes(layout.nodes);
            layoutAppliedRef.current = true;

            requestAnimationFrame(() => {
                void fitView({ maxZoom: 1.2, padding: 0.1 });
                setIsLayoutReady(true);
            });
        }
    }, [nodesInitialized, nodes, edges, setNodes, fitView]);

    const handleNodeClick = useCallback(
        (_: React.MouseEvent, node: OntologyNode) => {
            onNodeSelect(node.id);
        },
        [onNodeSelect],
    );

    const handlePaneClick = useCallback(() => {
        onNodeSelect(null);
    }, [onNodeSelect]);

    return (
        <div
            style={{
                height: '100%',
                opacity: isLayoutReady ? 1 : 0,
                transition: 'opacity 0.3s',
            }}
        >
            <ReactFlow
                className={styles.reactFlow}
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onPaneClick={handlePaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodesDraggable={false}
                nodesConnectable={false}
                edgesReconnectable={false}
                fitView
                fitViewOptions={{ maxZoom: 1.2 }}
                proOptions={{ hideAttribution: true }}
            >
                <Background gap={16} size={1} />
            </ReactFlow>

            <div className={styles.legend}>
                {(Object.keys(NODE_KIND_COLORS) as NodeKind[]).map((kind) => (
                    <div key={kind} className={styles.legendItem}>
                        <span
                            className={styles.legendDot}
                            style={{
                                backgroundColor: NODE_KIND_COLORS[kind].bg,
                                borderColor: NODE_KIND_COLORS[kind].border,
                            }}
                        />
                        {NODE_KIND_LABELS[kind]}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ObservatoryCanvas;
