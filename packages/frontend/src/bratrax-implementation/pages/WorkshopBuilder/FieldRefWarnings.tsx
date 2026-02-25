/**
 * Inline field-ref warning indicators for the OntologyBuilder.
 *
 * Shows a compact warning banner when any backing $sources.X.Y.Z refs
 * in the current ontology cannot be resolved against loaded catalogs.
 * Designed to sit inside the property list for quick visual feedback.
 */
import { Group, Stack, Text, Tooltip } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import type { FC } from 'react';

type Props = {
    /** Map of ref string -> warning message, from useBuilderState.fieldRefWarnings */
    warningsByRef: Map<string, string>;
    /** The $sources ref to check for this specific property row */
    refValue: string;
};

/**
 * Single-ref inline indicator: shows a warning icon next to a property
 * row when its backing ref cannot be resolved in the catalog.
 */
export const FieldRefIndicator: FC<Props> = ({ warningsByRef, refValue }) => {
    const warning = warningsByRef.get(refValue);
    if (!warning) return null;

    return (
        <Tooltip label={warning} multiline w={300}>
            <IconAlertTriangle
                size={14}
                color="var(--mantine-color-yellow-6)"
            />
        </Tooltip>
    );
};

type SummaryProps = {
    /** Map of ref string -> warning message */
    warningsByRef: Map<string, string>;
    /** Only show warnings for refs used by the given object's properties */
    objectRefs: string[];
};

/**
 * Summary banner: shows a condensed list of all unresolved field refs
 * for a given object. Renders nothing when all refs are valid.
 */
export const FieldRefSummary: FC<SummaryProps> = ({
    warningsByRef,
    objectRefs,
}) => {
    const relevantWarnings = objectRefs
        .filter((ref) => warningsByRef.has(ref))
        .map((ref) => ({
            ref,
            warning: warningsByRef.get(ref) ?? '',
        }));

    if (relevantWarnings.length === 0) return null;

    return (
        <Stack
            spacing={4}
            py={6}
            px={10}
            sx={(theme) => ({
                backgroundColor: theme.colors.yellow[0],
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.yellow[3]}`,
            })}
        >
            <Text size="xs" weight={600} color="yellow.8">
                {relevantWarnings.length} unresolved field{' '}
                {relevantWarnings.length === 1 ? 'ref' : 'refs'}
            </Text>
            {relevantWarnings.slice(0, 5).map((w) => (
                <Group key={w.ref} spacing={6} noWrap>
                    <IconAlertTriangle
                        size={12}
                        color="var(--mantine-color-yellow-7)"
                    />
                    <Text size="xs" color="yellow.8" lineClamp={1}>
                        <Text span ff="monospace" size="xs">
                            {w.ref}
                        </Text>
                        {' — '}
                        {w.warning}
                    </Text>
                </Group>
            ))}
            {relevantWarnings.length > 5 && (
                <Text size="xs" color="yellow.7">
                    ...and {relevantWarnings.length - 5} more
                </Text>
            )}
        </Stack>
    );
};
