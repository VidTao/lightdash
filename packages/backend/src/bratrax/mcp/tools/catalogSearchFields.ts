import { z } from 'zod';
import { searchCatalogs } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerCatalogSearchFieldsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.CATALOG_SEARCH_FIELDS,
        {
            description:
                'Search for fields by name across all Meltano taps. ' +
                'Returns matching fields with their tap, stream, type, and $sources.* ref. ' +
                'Use this to find which streams have a "spend", "email", or "order_id" field.',
            inputSchema: ctx.compatSchema(
                z.object({
                    query: z
                        .string()
                        .describe(
                            'Field name substring to search for, e.g. "spend", "email"',
                        ),
                    type: z
                        .string()
                        .optional()
                        .describe(
                            'Optional BQ type filter, e.g. "STRING", "FLOAT64"',
                        ),
                }),
            ),
        },
        async (args: { query: string; type?: string }, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.CATALOG_SEARCH_FIELDS,
            );
            ctx.canAccessMcp(pctx);

            try {
                const data = await searchCatalogs(
                    args.query,
                    args.type,
                    20,
                );
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error searching catalogs: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
