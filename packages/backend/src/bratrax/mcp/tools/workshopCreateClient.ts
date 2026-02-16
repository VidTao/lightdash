import { AnyType } from '@lightdash/common';
import { z } from 'zod';
import { createClient } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

const inputSchema = z
    .object({
        name: z
            .string()
            .describe(
                'Client name (lowercase alphanumeric with underscores, starting with a letter)',
            ),
        stack: z
            .string()
            .optional()
            .describe(
                'Template stack to use (e.g. "shopify-paid-media"). Defaults to "shopify-paid-media".',
            ),
    })
    .describe(
        'Create a new Bratrax client from a stack template. ' +
            'Generates config.yaml, ontology.yaml, sources.yaml, and tracking_plan.yaml.',
    );

export function registerWorkshopCreateClientTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_CREATE_CLIENT,
        {
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_CREATE_CLIENT,
            );
            ctx.canAccessMcp(pctx);

            try {
                const data = await createClient(args.name, args.stack);
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error creating client: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
