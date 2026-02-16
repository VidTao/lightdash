import { AnyType } from '@lightdash/common';
import { z } from 'zod';
import { compileClient } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

const inputSchema = z
    .object({
        client_name: z
            .string()
            .describe('Name of the client to compile'),
    })
    .describe(
        'Compile a Bratrax client from disk. Validates first, then generates ' +
            'Dataform .sqlx models (flatten, activity stream, dim tables) ' +
            'and Meltano config. Returns artifact list with content.',
    );

export function registerWorkshopCompileTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_COMPILE,
        {
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_COMPILE,
            );
            ctx.canAccessMcp(pctx);

            try {
                const data = await compileClient(args.client_name);
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error compiling client: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
