import { Box, Button, Group, Tabs, Text, Tooltip } from '@mantine/core';
import {
    IconCheck,
    IconDatabase,
    IconDeviceFloppy,
    IconEye,
    IconFileCode,
    IconHammer,
    IconSitemap,
} from '@tabler/icons-react';
import { useCallback, useEffect, useState, type FC } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import {
    useBratraxCompile,
    useBratraxGraph,
    useBratraxValidate,
    type CompileResult,
} from '../../hooks/useBratraxApi';
import {
    useBratraxCompileClient,
    useBratraxValidateClient,
} from '../../hooks/useBratraxClients';
import ClientSelector from './ClientSelector';
import CompileResultsPanel from './CompileResultsPanel';
import OntologyBuilder from './OntologyBuilder';
import SourcesBuilder from './SourcesBuilder';
import TemplateSelector from './TemplateSelector';
import TrackingPlanBuilder from './TrackingPlanBuilder';
import ValidationBar from './ValidationBar';
import { toCompilerPayload } from './compilerYamlTransformer';
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
    const [searchParams] = useSearchParams();

    const validateMutation = useBratraxValidate();
    const compileMutation = useBratraxCompile();
    const graphMutation = useBratraxGraph();
    const validateClientMutation = useBratraxValidateClient();
    const compileClientMutation = useBratraxCompileClient();

    // Auto-load client from ?client= query param
    useEffect(() => {
        const clientParam = searchParams.get('client');
        if (
            clientParam &&
            clientParam !== 'preview' &&
            clientParam !== builder.clientName
        ) {
            void builder.loadClient(clientParam);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTabChange = useCallback((value: string | null) => {
        if (value) {
            setActiveTab(value as BuilderTab);
        }
    }, []);

    const handleValidate = useCallback(async () => {
        builder.setIsValidating(true);
        if (builder.clientName) {
            // Save first, then validate via server-side client endpoint
            await builder.saveClient();
            validateClientMutation.mutate(builder.clientName, {
                onSuccess: (result) => {
                    builder.setCompilerValidation(result as any);
                    builder.setIsValidating(false);
                },
                onError: () => {
                    builder.setIsValidating(false);
                },
            });
        } else {
            const payload = toCompilerPayload(builder.state, 'preview');
            validateMutation.mutate(payload, {
                onSuccess: (result) => {
                    builder.setCompilerValidation(result);
                    builder.setIsValidating(false);
                },
                onError: () => {
                    builder.setIsValidating(false);
                },
            });
        }
    }, [builder, validateMutation, validateClientMutation]);

    const handleCompile = useCallback(async () => {
        builder.setIsCompiling(true);
        setShowCompilePanel(true);
        if (builder.clientName) {
            await builder.saveClient();
            compileClientMutation.mutate(builder.clientName, {
                onSuccess: (result) => {
                    setCompileResult(result as CompileResult);
                    builder.setIsCompiling(false);
                },
                onError: () => {
                    builder.setIsCompiling(false);
                },
            });
        } else {
            const payload = toCompilerPayload(builder.state, 'preview');
            compileMutation.mutate(payload, {
                onSuccess: (result) => {
                    setCompileResult(result);
                    builder.setIsCompiling(false);
                },
                onError: () => {
                    builder.setIsCompiling(false);
                },
            });
        }
    }, [builder, compileMutation, compileClientMutation]);

    const handleViewObservatory = useCallback(() => {
        const payload = toCompilerPayload(
            builder.state,
            builder.clientName ?? 'preview',
        );
        graphMutation.mutate(payload, {
            onSuccess: (result) => {
                sessionStorage.setItem('bratrax-graph', JSON.stringify(result));
                const clientParam = builder.clientName ?? 'preview';
                void navigate(
                    `/projects/${projectUuid}/observatory?client=${clientParam}`,
                );
            },
        });
    }, [
        builder.state,
        builder.clientName,
        graphMutation,
        navigate,
        projectUuid,
    ]);

    const handleLoadTemplate = useCallback(
        (files: Record<string, string>) => {
            builder.loadFromTemplate(files);
        },
        [builder],
    );

    const handleSelectClient = useCallback(
        (name: string) => {
            void builder.loadClient(name);
        },
        [builder],
    );

    const handleSave = useCallback(() => {
        void builder.saveClient();
    }, [builder]);

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
                    <ClientSelector
                        currentClient={builder.clientName}
                        onSelectClient={handleSelectClient}
                    />
                    {builder.isDirty && (
                        <Text size="xs" color="orange">
                            (unsaved)
                        </Text>
                    )}
                    <Tooltip
                        label={
                            !builder.clientName
                                ? 'Select or create a client first'
                                : !builder.isDirty
                                  ? 'No changes to save'
                                  : 'Save to disk'
                        }
                    >
                        <Button
                            size="xs"
                            variant="light"
                            color="teal"
                            leftIcon={<IconDeviceFloppy size={14} />}
                            onClick={handleSave}
                            loading={builder.isSaving}
                            disabled={!builder.isDirty || !builder.clientName}
                        >
                            Save
                        </Button>
                    </Tooltip>
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
