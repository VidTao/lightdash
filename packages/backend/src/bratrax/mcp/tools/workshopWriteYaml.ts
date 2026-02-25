import { AnyType } from '@lightdash/common';
import { load as loadYaml } from 'js-yaml';
import { z } from 'zod';
import type { BratraxOntologyFileKey } from '../../../database/entities/bratraxOntology';
import { getBratraxOntologyModel } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

/**
 * Lightweight structural validation for ontology YAML files.
 * This is NOT full compilation validation (use workshopValidate for that).
 * It checks that required top-level keys exist for each file type.
 */
function validateFileSchema(
    file: string,
    parsed: unknown,
): string[] {
    const errors: string[] = [];
    if (!parsed || typeof parsed !== 'object') {
        errors.push(`Expected a YAML object, got ${typeof parsed}`);
        return errors;
    }
    const obj = parsed as Record<string, unknown>;

    switch (file) {
        case 'config':
            if (!obj.name && !obj.template_id && !obj.display_name) {
                errors.push(
                    'config must have at least one of: name, template_id, display_name',
                );
            }
            break;
        case 'sources':
            if (!obj.sources || typeof obj.sources !== 'object') {
                errors.push('sources file must have a "sources" key (object)');
            }
            break;
        case 'ontology':
            if (!obj.objects || typeof obj.objects !== 'object') {
                errors.push(
                    'ontology file must have an "objects" key (object)',
                );
            }
            break;
        case 'tracking_plan':
            if (!obj.events || typeof obj.events !== 'object') {
                errors.push(
                    'tracking_plan file must have an "events" key (object)',
                );
            }
            break;
        default:
            break;
    }
    return errors;
}

const inputSchema = z
    .object({
        file: z
            .enum(['config', 'ontology', 'sources', 'tracking_plan'])
            .describe('Which YAML file to write'),
        content: z
            .string()
            .describe(
                'Full YAML content to write. Must be valid YAML syntax.',
            ),
    })
    .describe(
        'Write a specific ontology YAML file for the current project. ' +
            'The entire file content is replaced.',
    );

export function registerWorkshopWriteYamlTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_WRITE_YAML,
        {
            title: TOOL_TITLES[BratraxMcpToolName.WORKSHOP_WRITE_YAML],
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.WORKSHOP_WRITE_YAML],
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_WRITE_YAML,
            );
            ctx.canAccessMcp(pctx);

            // Validate YAML syntax before persisting to the database.
            let parsed: unknown;
            try {
                parsed = loadYaml(args.content);
            } catch (yamlError: unknown) {
                const yamlMsg =
                    yamlError instanceof Error
                        ? yamlError.message
                        : 'parse error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Invalid YAML syntax: ${yamlMsg}`,
                        },
                    ],
                    isError: true,
                };
            }

            // Validate basic schema structure for the file type.
            const schemaErrors = validateFileSchema(args.file, parsed);
            if (schemaErrors.length > 0) {
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Schema validation errors:\n${schemaErrors.join('\n')}`,
                        },
                    ],
                    isError: true,
                };
            }

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                await ctx.requireProjectAccess(pctx, projectUuid);
                const model = getBratraxOntologyModel(ctx.services);
                await model.upsertFile(
                    projectUuid,
                    args.file as BratraxOntologyFileKey,
                    args.content,
                );
                return ctx.textResult(
                    JSON.stringify({ saved: true, file: args.file }, null, 2),
                );
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error writing YAML: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
