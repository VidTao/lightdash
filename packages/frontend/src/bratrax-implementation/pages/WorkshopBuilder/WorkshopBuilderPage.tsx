import { Box, Button, Group, Loader, Tabs, Text, Tooltip } from '@mantine/core';
import {
    IconCheck,
    IconDatabase,
    IconDeviceFloppy,
    IconEye,
    IconFileCode,
    IconHammer,
    IconRadar,
    IconSitemap,
} from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useNavigate, useParams } from 'react-router';
import {
    useBratraxGraph,
    type CompileResult,
} from '../../hooks/useBratraxApi';
import {
    useBratraxProjectConfig,
    useBratraxValidateOntology,
    useBratraxCompileOntology,
} from '../../hooks/useBratraxClients';
import {
    useBratraxOntologyDrift,
    type DriftCheckResult,
} from '../../hooks/useBratraxDrift';
import CompileResultsPanel from './CompileResultsPanel';
import DriftPanel from './DriftPanel';
import OntologyBuilder from './OntologyBuilder';
import OntologySetup from './OntologySetup';
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
    const [showDriftPanel, setShowDriftPanel] = useState(false);
    const [driftResult, setDriftResult] = useState<DriftCheckResult | null>(
        null,
    );
    const navigate = useNavigate();
    const { projectUuid } = useParams<{ projectUuid: string }>();
    const builder = useBuilderState(projectUuid);

    const {
        data: projectConfig,
        isLoading: isLoadingConfig,
        refetch: refetchConfig,
    } = useBratraxProjectConfig(projectUuid);
    const isBound = projectConfig?.bound ?? false;

    const graphMutation = useBratraxGraph();
    const validateOntologyMutation = useBratraxValidateOntology(projectUuid);
    const compileOntologyMutation = useBratraxCompileOntology(projectUuid);
    const driftMutation = useBratraxOntologyDrift(projectUuid);

    const handleSetupComplete = useCallback(() => {
        void refetchConfig();
    }, [refetchConfig]);

    const handleTabChange = useCallback((value: string | null) => {
        if (value) {
            setActiveTab(value as BuilderTab);
        }
    }, []);

    const handleValidate = useCallback(async () => {
        builder.setIsValidating(true);
        await builder.saveClient();
        validateOntologyMutation.mutate(undefined, {
            onSuccess: (result) => {
                builder.setCompilerValidation(result as any);
                builder.setIsValidating(false);
            },
            onError: () => {
                builder.setIsValidating(false);
            },
        });
    }, [builder, validateOntologyMutation]);

    const hasValidationErrors = builder.validationMessages.some(
        (m) => m.severity === 'error',
    );

    const handleCompile = useCallback(async () => {
        if (hasValidationErrors) return;
        builder.setIsCompiling(true);
        setShowCompilePanel(true);
        setShowDriftPanel(false);
        await builder.saveClient();
        compileOntologyMutation.mutate(undefined, {
            onSuccess: (result) => {
                setCompileResult(result as CompileResult);
                builder.setIsCompiling(false);
            },
            onError: () => {
                builder.setIsCompiling(false);
            },
        });
    }, [builder, compileOntologyMutation, hasValidationErrors]);

    const handleViewObservatory = useCallback(() => {
        const payload = toCompilerPayload(
            builder.state,
            builder.clientName ?? 'preview',
        );
        graphMutation.mutate(payload, {
            onSuccess: (result) => {
                sessionStorage.setItem('bratrax-graph', JSON.stringify(result));
                void navigate(
                    `/projects/${projectUuid}/observatory`,
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

    const handleDriftCheck = useCallback(async () => {
        if (!isBound) return;
        setShowDriftPanel(true);
        setShowCompilePanel(false);
        await builder.saveClient();
        driftMutation.mutate(undefined, {
            onSuccess: (result) => {
                setDriftResult(result);
            },
        });
    }, [builder, driftMutation, isBound]);

    const handleLoadTemplate = useCallback(
        (files: Record<string, string>) => {
            builder.loadFromTemplate(files);
        },
        [builder],
    );

    const handleSave = useCallback(() => {
        void builder.saveClient();
    }, [builder]);

    // Show loading while checking project config
    if (isLoadingConfig) {
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

    // Show setup wizard if no ontology is bound
    if (!isBound && projectUuid) {
        return (
            <Box className={styles.container}>
                <OntologySetup
                    projectUuid={projectUuid}
                    onSetupComplete={handleSetupComplete}
                />
            </Box>
        );
    }

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
                    {builder.isDirty && (
                        <Text size="xs" color="orange">
                            (unsaved)
                        </Text>
                    )}
                    <Tooltip
                        label={
                            !builder.isDirty
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
                            disabled={!builder.isDirty}
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
                    <Tooltip
                        label={
                            hasValidationErrors
                                ? 'Fix validation errors before compiling'
                                : 'Compile ontology to Dataform + Meltano artifacts'
                        }
                    >
                        <Button
                            size="xs"
                            variant="light"
                            color="blue"
                            leftIcon={<IconHammer size={14} />}
                            onClick={handleCompile}
                            loading={builder.isCompiling}
                            disabled={hasValidationErrors}
                        >
                            Compile
                        </Button>
                    </Tooltip>
                    <Tooltip label="Run drift analysis against catalog">
                        <Button
                            size="xs"
                            variant="light"
                            color="orange"
                            leftIcon={<IconRadar size={14} />}
                            onClick={handleDriftCheck}
                            loading={driftMutation.isLoading}
                        >
                            Drift Check
                        </Button>
                    </Tooltip>
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
                    {showDriftPanel ? (
                        <DriftPanel
                            result={driftResult}
                            isLoading={driftMutation.isLoading}
                            onClose={() => setShowDriftPanel(false)}
                        />
                    ) : showCompilePanel ? (
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
