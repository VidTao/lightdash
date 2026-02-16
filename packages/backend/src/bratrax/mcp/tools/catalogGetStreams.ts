import { z } from 'zod';
import { getTapStreams } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerCatalogGetStreamsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.CATALOG_GET_STREAMS,
        {
            description:
                'Get the list of streams (tables) available in a specific Meltano tap. ' +
                'Returns stream names, field counts, key properties, and replication method. ' +
                'Use catalog_list_taps first to find the tap name.',
            inputSchema: ctx.compatSchema(
                z.object({
                    tap: z
                        .string()
                        .describe(
                            'Tap name, e.g. "tap-shopify", "tap-facebook"',
                        ),
                }),
            ),
        },
        async (args: { tap: string }, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.CATALOG_GET_STREAMS);
            ctx.canAccessMcp(pctx);

            try {
                const data = await getTapStreams(args.tap);
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                const is404 =
                    typeof e === 'object' &&
                    e !== null &&
                    'response' in e &&
                    (e as { response?: { status?: number } }).response
                        ?.status === 404;
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: is404
                                ? `Tap '${args.tap}' not found. Use catalog_list_taps to see available taps.`
                                : `Error fetching streams: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
