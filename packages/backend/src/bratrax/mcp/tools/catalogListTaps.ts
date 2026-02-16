import { getCatalogs } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerCatalogListTapsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.CATALOG_LIST_TAPS,
        {
            description:
                'List all available Meltano Singer data source taps with stream counts and categories. ' +
                'Use this to discover what data sources are available before drilling into streams or fields.',
            inputSchema: {},
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.CATALOG_LIST_TAPS);
            ctx.canAccessMcp(pctx);

            try {
                const data = await getCatalogs();
                const taps = (data.catalogs ?? []).map(
                    (c: {
                        tap: string;
                        label: string;
                        category: string;
                        source_name: string;
                        streams: unknown[];
                    }) => ({
                        tap: c.tap,
                        label: c.label,
                        category: c.category,
                        source_name: c.source_name,
                        stream_count: c.streams.length,
                    }),
                );
                return ctx.textResult(JSON.stringify(taps, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error listing taps: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
