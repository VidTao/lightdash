import { Box, Button, Group, Tabs } from '@mantine/core';
import {
    IconCheck,
    IconDatabase,
    IconEye,
    IconFileCode,
    IconHammer,
    IconSitemap,
} from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useNavigate, useParams } from 'react-router';
import {
    useBratraxCompile,
    useBratraxGraph,
    useBratraxValidate,
    type CompileResult,
} from '../../hooks/useBratraxApi';
import { toCompilerPayload } from './compilerYamlTransformer';
import CompileResultsPanel from './CompileResultsPanel';
import OntologyBuilder from './OntologyBuilder';
import SourcesBuilder from './SourcesBuilder';
import TemplateSelector from './TemplateSelector';
import TrackingPlanBuilder from './TrackingPlanBuilder';
import ValidationBar from './ValidationBar';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './WorkshopBuilder.module.css';
import YamlPreview from './YamlPreview';
import type { BuilderTab } from './types';
import { useBuilderState } from './useBuilderState';

const WorkshopBuilderPage: FC = () => {
    const [activeTab, setActiveTab] = useState<BuilderTab>('sources');
    const [compileResult, setCompileResult] = useState<CompileResult | null>(
        null,
    );
    const [showCompilePanel, setShowCompilePanel] = useState(false);
    const builder = useBuilderState();
    const navigate = useNavigate();
    const { projectUuid } = useParams<{ projectUuid: string }>();

    const validateMutation = useBratraxValidate();
    const compileMutation = useBratraxCompile();
    const graphMutation = useBratraxGraph();

    const handleTabChange = useCallback((value: string | null) => {
        if (value) {
            setActiveTab(value as BuilderTab);
        }
    }, []);

    const handleValidate = useCallback(() => {
        const payload = toCompilerPayload(builder.state, 'preview');
        builder.setIsValidating(true);
        validateMutation.mutate(payload, {
            onSuccess: (result) => {
                builder.setCompilerValidation(result);
                builder.setIsValidating(false);
            },
            onError: () => {
                builder.setIsValidating(false);
            },
        });
    }, [builder, validateMutation]);

    const handleCompile = useCallback(() => {
        const payload = toCompilerPayload(builder.state, 'preview');
        builder.setIsCompiling(true);
        setShowCompilePanel(true);
        compileMutation.mutate(payload, {
            onSuccess: (result) => {
                setCompileResult(result);
                builder.setIsCompiling(false);
            },
            onError: () => {
                builder.setIsCompiling(false);
            },
        });
    }, [builder, compileMutation]);

    const handleViewObservatory = useCallback(() => {
        const payload = toCompilerPayload(builder.state, 'preview');
        graphMutation.mutate(payload, {
            onSuccess: (result) => {
                // Store graph data and navigate to observatory
                sessionStorage.setItem(
                    'bratrax-graph',
                    JSON.stringify(result),
                );
                navigate(`/projects/${projectUuid}/observatory?client=preview`);
            },
        });
    }, [builder.state, graphMutation, navigate, projectUuid]);

    const handleLoadTemplate = useCallback(
        (files: Record<string, string>) => {
            builder.loadFromTemplate(files);
        },
        [builder],
    );

    return (
        <Box className={styles.container}>
            <Group position="apart" px="md" py={6}>
                <Tabs value={activeTab} onTabChange={handleTabChange}>
                    <Tabs.List>
                        <Tabs.Tab
                            value="sources"
                            icon={<IconDatabase size={16} />}
                        >
                            Sources
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="ontology"
                            icon={<IconSitemap size={16} />}
                        >
                            Ontology
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="tracking-plan"
                            icon={<IconFileCode size={16} />}
                        >
                            Tracking Plan
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Group spacing={6}>
                    <TemplateSelector onLoad={handleLoadTemplate} />
                    <Button
                        size="xs"
                        variant="light"
                        color="green"
                        leftIcon={<IconCheck size={14} />}
                        onClick={handleValidate}
                        loading={builder.isValidating}
                    >
                        Validate
                    </Button>
                    <Button
                        size="xs"
                        variant="light"
                        color="blue"
                        leftIcon={<IconHammer size={14} />}
                        onClick={handleCompile}
                        loading={builder.isCompiling}
                    >
                        Compile
                    </Button>
                    <Button
                        size="xs"
                        variant="light"
                        color="violet"
                        leftIcon={<IconEye size={14} />}
                        onClick={handleViewObservatory}
                        loading={graphMutation.isLoading}
                    >
                        Observatory
                    </Button>
                </Group>
            </Group>

            <PanelGroup direction="horizontal" style={{ flex: 1 }}>
                <Panel id="builder-content" order={1}>
                    <Box className={styles.tabContent}>
                        {activeTab === 'sources' && (
                            <SourcesBuilder
                                sources={builder.state.sources}
                                setSources={builder.setSources}
                                toggleStream={builder.toggleStream}
                                toggleField={builder.toggleField}
                            />
                        )}
                        {activeTab === 'ontology' && (
                            <OntologyBuilder
                                objects={builder.state.objects}
                                links={builder.state.links}
                                events={builder.state.events}
                                addObject={builder.addObject}
                                updateObject={builder.updateObject}
                                removeObject={builder.removeObject}
                                addProperty={builder.addProperty}
                                removeProperty={builder.removeProperty}
                                addLink={builder.addLink}
                                removeLink={builder.removeLink}
                            />
                        )}
                        {activeTab === 'tracking-plan' && (
                            <TrackingPlanBuilder
                                events={builder.state.events}
                                objects={builder.state.objects}
                                addEvent={builder.addEvent}
                                updateEvent={builder.updateEvent}
                                removeEvent={builder.removeEvent}
                                addEventProperty={builder.addEventProperty}
                                addEnrichment={builder.addEnrichment}
                            />
                        )}
                    </Box>
                </Panel>

                <PanelResizeHandle className={styles.resizeHandle} />

                <Panel
                    id="yaml-preview"
                    order={2}
                    defaultSize={30}
                    minSize={20}
                    maxSize={50}
                >
                    {showCompilePanel ? (
                        <CompileResultsPanel
                            result={compileResult}
                            isCompiling={builder.isCompiling}
                            onClose={() => setShowCompilePanel(false)}
                        />
                    ) : (
                        <YamlPreview
                            state={builder.state}
                            activeTab={activeTab}
                        />
                    )}
                </Panel>
            </PanelGroup>

            <ValidationBar
                messages={builder.validationMessages}
                activeTab={activeTab}
            />
        </Box>
    );
};

export default WorkshopBuilderPage;
