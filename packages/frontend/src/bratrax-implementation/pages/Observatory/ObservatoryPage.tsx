import { Box } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';
import { useCallback, useState, type FC } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './Observatory.module.css';
import ObservatoryCanvas from './ObservatoryCanvas';
import ObservatoryPanel from './ObservatoryPanel';
import { VIDTAO_SAMPLE_DATA } from './sampleData';

const ObservatoryPage: FC = () => {
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const handleNodeSelect = useCallback((nodeId: string | null) => {
        setSelectedNodeId(nodeId);
    }, []);

    return (
        <Box className={styles.container}>
            <ReactFlowProvider>
                <PanelGroup direction="horizontal" style={{ height: '100%' }}>
                    <Panel id="observatory-canvas" order={1}>
                        <ObservatoryCanvas
                            graphData={VIDTAO_SAMPLE_DATA}
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
                                    graphData={VIDTAO_SAMPLE_DATA}
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
