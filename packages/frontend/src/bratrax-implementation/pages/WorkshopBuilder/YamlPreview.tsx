import { Button, Group, Stack, Text, Title } from '@mantine/core';
import { IconCopy, IconDownload } from '@tabler/icons-react';
import yaml from 'js-yaml';
import { useCallback, useMemo, type FC } from 'react';
// eslint-disable-next-line css-modules/no-unused-class
import styles from './WorkshopBuilder.module.css';
import type { BuilderState, BuilderTab } from './types';

type Props = {
    state: BuilderState;
    activeTab: BuilderTab;
};

function generateSourcesYaml(state: BuilderState): string {
    const sources: Record<string, unknown> = {};

    for (const src of state.sources) {
        const selectedStreams = src.streams.filter((s) => s.selected);
        if (selectedStreams.length === 0) continue;

        const streams: Record<string, unknown> = {};
        for (const stream of selectedStreams) {
            const fields: Record<string, string> = {};
            for (const field of stream.fields.filter((f) => f.selected)) {
                fields[field.name] = field.type;
            }
            streams[stream.name] = { fields };
        }

        sources[src.tap] = {
            label: src.label,
            category: src.category,
            streams,
        };
    }

    return yaml.dump({ sources }, { lineWidth: 120, noRefs: true });
}

function generateOntologyYaml(state: BuilderState): string {
    const objects: Record<string, unknown> = {};

    for (const obj of state.objects) {
        const properties: Record<string, unknown> = {};
        for (const prop of obj.properties) {
            const propDef: Record<string, string> = {
                type: prop.type,
                kind: prop.kind,
            };
            if (prop.ref) propDef.ref = prop.ref;
            properties[prop.name] = propDef;
        }
        objects[obj.name] = { properties };
    }

    const links = state.links.map((link) => {
        const srcObj = state.objects.find((o) => o.id === link.sourceObjectId);
        const tgtObj = state.objects.find((o) => o.id === link.targetObjectId);
        return {
            source: srcObj?.name ?? link.sourceObjectId,
            verb: link.verb,
            target: tgtObj?.name ?? link.targetObjectId,
            cardinality: link.cardinality,
        };
    });

    const ontology: Record<string, unknown> = { objects };
    if (links.length > 0) ontology.links = links;

    return yaml.dump(ontology, { lineWidth: 120, noRefs: true });
}

function generateTrackingPlanYaml(state: BuilderState): string {
    const events = state.events.map((event) => {
        const evtDef: Record<string, unknown> = {
            name: event.name,
            category: event.category,
        };

        if (event.properties.length > 0) {
            const props: Record<string, unknown> = {};
            for (const prop of event.properties) {
                props[prop.name] = {
                    type: prop.type,
                    required: prop.required,
                };
            }
            evtDef.properties = props;
        }

        if (event.enrichments.length > 0) {
            const enrichments = event.enrichments.map((e) => {
                const obj = state.objects.find((o) => o.id === e.objectId);
                return {
                    event_property:
                        state.events
                            .flatMap((ev) => ev.properties)
                            .find((p) => p.id === e.eventPropertyId)?.name ??
                        e.eventPropertyId,
                    object: obj?.name ?? e.objectId,
                    property: e.objectPropertyName,
                };
            });
            evtDef.enrichments = enrichments;
        }

        return evtDef;
    });

    return yaml.dump({ events }, { lineWidth: 120, noRefs: true });
}

const TAB_YAML_GENERATORS: Record<BuilderTab, (state: BuilderState) => string> =
    {
        sources: generateSourcesYaml,
        ontology: generateOntologyYaml,
        'tracking-plan': generateTrackingPlanYaml,
    };

const TAB_FILE_NAMES: Record<BuilderTab, string> = {
    sources: 'sources.yaml',
    ontology: 'ontology.yaml',
    'tracking-plan': 'tracking_plan.yaml',
};

const YamlPreview: FC<Props> = ({ state, activeTab }) => {
    const yamlContent = useMemo(
        () => TAB_YAML_GENERATORS[activeTab](state),
        [state, activeTab],
    );

    const handleCopy = useCallback(() => {
        void navigator.clipboard.writeText(yamlContent);
    }, [yamlContent]);

    const handleDownload = useCallback(() => {
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = TAB_FILE_NAMES[activeTab];
        a.click();
        URL.revokeObjectURL(url);
    }, [yamlContent, activeTab]);

    return (
        <div className={styles.yamlPreview}>
            <Stack spacing={8} style={{ height: '100%' }}>
                <Group position="apart">
                    <Title order={6}>{TAB_FILE_NAMES[activeTab]}</Title>
                    <Group spacing={4}>
                        <Button
                            size="xs"
                            variant="subtle"
                            leftIcon={<IconCopy size={14} />}
                            onClick={handleCopy}
                        >
                            Copy
                        </Button>
                        <Button
                            size="xs"
                            variant="subtle"
                            leftIcon={<IconDownload size={14} />}
                            onClick={handleDownload}
                        >
                            Export
                        </Button>
                    </Group>
                </Group>

                <div className={styles.yamlCode}>
                    {yamlContent || (
                        <Text color="dimmed" size="sm">
                            Start building to see YAML output...
                        </Text>
                    )}
                </div>
            </Stack>
        </div>
    );
};

export default YamlPreview;
