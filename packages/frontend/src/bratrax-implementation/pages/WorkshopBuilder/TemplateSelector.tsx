import { Button, Group, Modal, Stack, Text } from '@mantine/core';
import { IconTemplate } from '@tabler/icons-react';
import { useCallback, useState, type FC } from 'react';
import { BUNDLED_TEMPLATES, type BundledTemplate } from './bundledTemplates';

type Props = {
    onLoad: (files: Record<string, string>) => void;
};

const TemplateSelector: FC<Props> = ({ onLoad }) => {
    const [opened, setOpened] = useState(false);
    const [selectedTemplate, setSelectedTemplate] =
        useState<BundledTemplate | null>(null);

    const handleLoad = useCallback(() => {
        if (selectedTemplate) {
            onLoad(selectedTemplate.files);
            setOpened(false);
            setSelectedTemplate(null);
        }
    }, [selectedTemplate, onLoad]);

    return (
        <>
            <Button
                size="xs"
                variant="light"
                leftIcon={<IconTemplate size={14} />}
                onClick={() => setOpened(true)}
            >
                Load Template
            </Button>

            <Modal
                opened={opened}
                onClose={() => {
                    setOpened(false);
                    setSelectedTemplate(null);
                }}
                title="Load Stack Template"
                size="md"
            >
                <Stack spacing="sm">
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

                    {selectedTemplate && (
                        <Button onClick={handleLoad}>
                            Load &quot;{selectedTemplate.display_name}&quot;
                        </Button>
                    )}
                </Stack>
            </Modal>
        </>
    );
};

export default TemplateSelector;
