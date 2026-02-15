import { Box, Button, Group, Loader, Text } from '@mantine/core';
import { IconHammer } from '@tabler/icons-react';
import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useState, type FC } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { useOntologyGraph } from '../../hooks/useOntologyGraph';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './Observatory.module.css';
import ObservatoryCanvas from './ObservatoryCanvas';
import ObservatoryPanel from './ObservatoryPanel';
import { VIDTAO_SAMPLE_DATA } from './sampleData';
import type { OntologyGraphData } from './types';

const ObservatoryPage: FC = () => {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const client = searchParams.get('client');
    const navigate = useNavigate();
    const { projectUuid } = useParams<{ projectUuid: string }>();

    // Fetch live graph data if client param is present
    const { data: liveGraphData, isLoading, error } = useOntologyGraph();

    const handleNodeSelect = useCallback((nodeId: string | null) => {
        setSelectedNodeId(nodeId);
    }, []);

    // Use live data if available, fallback to sample
    const graphData: OntologyGraphData =
        client && liveGraphData ? liveGraphData : VIDTAO_SAMPLE_DATA;

    if (client && isLoading) {
        return (
            <Box
                className={styles.container}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Loader size="lg" />
            </Box>
        );
    }

    if (client && error) {
        return (
            <Box
                className={styles.container}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: 8,
                }}
            >
                <Text color="red" size="lg">
                    Failed to load graph data
                </Text>
                <Text color="dimmed" size="sm">
                    {error instanceof Error ? error.message : 'Unknown error'}
                </Text>
            </Box>
        );
    }

    return (
        <Box
            className={styles.container}
            style={{ display: 'flex', flexDirection: 'column' }}
        >
            <Group
                position="apart"
                px="md"
                py={6}
                style={{
                    borderBottom: '1px solid var(--mantine-color-gray-3)',
                    background: 'var(--mantine-color-body)',
                    zIndex: 10,
                }}
            >
                <Text size="sm" weight={600}>
                    Observatory
                </Text>
                <Button
                    size="xs"
                    variant="light"
                    leftIcon={<IconHammer size={14} />}
                    onClick={() => {
                        const params =
                            client && client !== 'preview'
                                ? `?client=${client}`
                                : '';
                        void navigate(
                            `/projects/${projectUuid}/workshop-builder${params}`,
                        );
                    }}
                >
                    Workshop Builder
                </Button>
            </Group>
            <ReactFlowProvider>
                <PanelGroup direction="horizontal" style={{ flex: 1 }}>
                    <Panel id="observatory-canvas" order={1}>
                        <ObservatoryCanvas
                            graphData={graphData}
                            onNodeSelect={handleNodeSelect}
                        />
                    </Panel>

                    {selectedNodeId && (
                        <>
                            <PanelResizeHandle
                                className={styles.resizeHandle}
                            />
                            <Panel
                                id="observatory-panel"
                                order={2}
                                defaultSize={30}
                                minSize={20}
                                maxSize={50}
                            >
                                <ObservatoryPanel
                                    nodeId={selectedNodeId}
                                    graphData={graphData}
                                />
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </ReactFlowProvider>
        </Box>
    );
};

export default ObservatoryPage;
