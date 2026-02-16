import { AnyType } from '@lightdash/common';
import { z } from 'zod';
import { validateClient } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

const inputSchema = z
    .object({
        client_name: z
            .string()
            .describe('Name of the client to validate'),
    })
    .describe(
        'Validate a Bratrax client by parsing its YAML files from disk, ' +
            'resolving $ref references, and running all validation rules. ' +
            'Returns errors and warnings.',
    );

export function registerWorkshopValidateTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_VALIDATE,
        {
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_VALIDATE,
            );
            ctx.canAccessMcp(pctx);

            try {
                const data = await validateClient(args.client_name);
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error validating client: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
