import { AnyType } from '@lightdash/common';
import { z } from 'zod';
import {
    deployYaml,
    getBratraxOntologyModel,
} from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

const inputSchema = z
    .object({
        apply: z
            .boolean()
            .optional()
            .describe(
                'If true, copy compiled artifacts to production directories. ' +
                    'Defaults to false (dry-run showing the plan only).',
            ),
    })
    .describe(
        'Deploy compiled Bratrax artifacts to production directories. ' +
            'By default performs a dry-run showing what would be copied. ' +
            'Pass apply: true to actually deploy.',
    );

export function registerWorkshopDeployTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_DEPLOY,
        {
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_DEPLOY,
            );
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const model = getBratraxOntologyModel(ctx.services);
                const files = await model.getFiles(projectUuid);
                const data = await deployYaml({
                    config: files.config ?? '',
                    ontology: files.ontology ?? '',
                    sources: files.sources ?? '',
                    tracking_plan: files.tracking_plan ?? '',
                    apply: args.apply ?? false,
                });
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error deploying: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
