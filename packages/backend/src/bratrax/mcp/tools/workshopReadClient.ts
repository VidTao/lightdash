import { AnyType } from '@lightdash/common';
import { z } from 'zod';
import { readClient } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

const inputSchema = z
    .object({
        client_name: z
            .string()
            .describe('Name of the client to read (e.g. "vidtao", "acme")'),
    })
    .describe(
        'Read all 4 YAML files (config, ontology, sources, tracking_plan) for a Bratrax client.',
    );

export function registerWorkshopReadClientTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_READ_CLIENT,
        {
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_READ_CLIENT,
            );
            ctx.canAccessMcp(pctx);

            try {
                const data = await readClient(args.client_name);
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error reading client: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
