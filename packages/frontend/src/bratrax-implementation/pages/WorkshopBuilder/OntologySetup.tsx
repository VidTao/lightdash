import {
    Box,
    Button,
    Card,
    Group,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    IconPlus,
    IconTemplate,
} from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
import { useBratraxInitOntology } from '../../hooks/useBratraxClients';
import { BUNDLED_TEMPLATES, type BundledTemplate } from './bundledTemplates';

type Props = {
    projectUuid: string;
    onSetupComplete: () => void;
};

type SetupStep = 'choose' | 'template' | 'blank';

const BLANK_FILES: Record<string, string> = {
    config: `template_id: blank
display_name: "Blank Ontology"
description: ""

warehouse:
  type: bigquery
  project: bratrax
  raw_dataset: raw_data
  cod_dataset: cod
`,
    ontology: `version: "1.0"
namespace: ""
generated_at: null

objects: {}
links: {}
metrics: {}
`,
    sources: `version: "1.0"
namespace: ""
generated_at: null

activity_stream:
  database: bigquery
  table: activity_stream
  schema:
    activity_id:
      type: STRING
    ts:
      type: TIMESTAMP
    activity:
      type: STRING
    customer:
      type: STRING
    anonymous_id:
      type: STRING
    features:
      type: JSON
    revenue_impact:
      type: FLOAT64
    source:
      type: STRING

sources: {}
`,
    tracking_plan: `version: "1.0"
namespace: ""
generated_at: null

categories: {}
events: {}
`,
};

const OntologySetup: FC<Props> = ({ projectUuid, onSetupComplete }) => {
    const [step, setStep] = useState<SetupStep>('choose');
    const [selectedTemplate, setSelectedTemplate] =
        useState<BundledTemplate | null>(null);

    const initMutation = useBratraxInitOntology(projectUuid);

    const handleCreateFromTemplate = useCallback(() => {
        if (!selectedTemplate) return;
        initMutation.mutate(selectedTemplate.files, {
            onSuccess: () => onSetupComplete(),
        });
    }, [selectedTemplate, initMutation, onSetupComplete]);

    const handleCreateBlank = useCallback(() => {
        initMutation.mutate(BLANK_FILES, {
            onSuccess: () => onSetupComplete(),
        });
    }, [initMutation, onSetupComplete]);

    if (step === 'choose') {
        return (
            <Box
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: 40,
                }}
            >
                <Stack spacing="lg" style={{ maxWidth: 500, width: '100%' }}>
                    <Title order={3}>Set Up Ontology</Title>
                    <Text color="dimmed" size="sm">
                        This project doesn&apos;t have an ontology yet. Choose
                        how to get started:
                    </Text>

                    <Card
                        shadow="sm"
                        padding="md"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => setStep('template')}
                    >
                        <Group>
                            <IconTemplate size={24} />
                            <div>
                                <Text weight={600}>Create from template</Text>
                                <Text size="xs" color="dimmed">
                                    Start with a pre-built stack (Shopify +
                                    Paid Media, etc.)
                                </Text>
                            </div>
                        </Group>
                    </Card>

                    <Card
                        shadow="sm"
                        padding="md"
                        withBorder
                        style={{ cursor: 'pointer' }}
                        onClick={() => setStep('blank')}
                    >
                        <Group>
                            <IconPlus size={24} />
                            <div>
                                <Text weight={600}>Create blank ontology</Text>
                                <Text size="xs" color="dimmed">
                                    Start from scratch with an empty ontology
                                </Text>
                            </div>
                        </Group>
                    </Card>
                </Stack>
            </Box>
        );
    }

    if (step === 'template') {
        return (
            <Box
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: 40,
                }}
            >
                <Stack spacing="md" style={{ maxWidth: 500, width: '100%' }}>
                    <Group>
                        <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => setStep('choose')}
                        >
                            Back
                        </Button>
                        <Title order={4}>Create from Template</Title>
                    </Group>

                    <Text size="sm" weight={600}>
                        Choose a template:
                    </Text>

                    {BUNDLED_TEMPLATES.map((tmpl) => (
                        <Button
                            key={tmpl.name}
                            variant={
                                selectedTemplate?.name === tmpl.name
                                    ? 'filled'
                                    : 'light'
                            }
                            onClick={() => setSelectedTemplate(tmpl)}
                            styles={{
                                root: { height: 'auto', padding: '10px 16px' },
                                label: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                },
                            }}
                        >
                            <Text size="sm" weight={600}>
                                {tmpl.display_name}
                            </Text>
                            <Text size="xs" color="dimmed">
                                {tmpl.description}
                            </Text>
                        </Button>
                    ))}

                    <Button
                        onClick={handleCreateFromTemplate}
                        loading={initMutation.isLoading}
                        disabled={!selectedTemplate}
                    >
                        Create Ontology
                    </Button>
                </Stack>
            </Box>
        );
    }

    if (step === 'blank') {
        return (
            <Box
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: 40,
                }}
            >
                <Stack spacing="md" style={{ maxWidth: 400, width: '100%' }}>
                    <Group>
                        <Button
                            variant="subtle"
                            size="xs"
                            onClick={() => setStep('choose')}
                        >
                            Back
                        </Button>
                        <Title order={4}>Create Blank Ontology</Title>
                    </Group>

                    <Text size="sm" color="dimmed">
                        This will create an empty ontology with stub YAML files
                        that you can fill in using the builder.
                    </Text>

                    <Button
                        onClick={handleCreateBlank}
                        loading={initMutation.isLoading}
                    >
                        Create Blank Ontology
                    </Button>
                </Stack>
            </Box>
        );
    }

    return null;
};

export default OntologySetup;
