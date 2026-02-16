import { z } from 'zod';
import { getStreamFields } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerCatalogGetFieldsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.CATALOG_GET_FIELDS,
        {
            description:
                'Get the field schema for a specific stream within a Meltano tap. ' +
                'Returns field names, BigQuery types, and nullable flags. ' +
                'Use catalog_get_streams first to find the stream name.',
            inputSchema: ctx.compatSchema(
                z.object({
                    tap: z
                        .string()
                        .describe(
                            'Tap name, e.g. "tap-shopify", "tap-facebook"',
                        ),
                    stream: z
                        .string()
                        .describe(
                            'Stream name, e.g. "orders", "campaigns"',
                        ),
                }),
            ),
        },
        async (args: { tap: string; stream: string }, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.CATALOG_GET_FIELDS);
            ctx.canAccessMcp(pctx);

            try {
                const data = await getStreamFields(args.tap, args.stream);
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
                                ? `Stream '${args.stream}' not found in tap '${args.tap}'. Use catalog_get_streams to see available streams.`
                                : `Error fetching fields: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
