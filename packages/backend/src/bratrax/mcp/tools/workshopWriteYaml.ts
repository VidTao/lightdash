import { AnyType } from '@lightdash/common';
import { z } from 'zod';
import type { BratraxOntologyFileKey } from '../../../database/entities/bratraxOntology';
import { getBratraxOntologyModel } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

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
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_WRITE_YAML,
            );
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
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
