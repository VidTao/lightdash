import { getCatalogs } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWorkshopGetCatalogsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_GET_CATALOGS,
        {
            description:
                'Get Meltano Singer source catalog discovery data. ' +
                'Returns available taps with their streams and field schemas. ' +
                'Use this during ontology workshops to discover available data sources.',
            inputSchema: {},
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_GET_CATALOGS,
            );
            ctx.canAccessMcp(pctx);

            try {
                const data = await getCatalogs();
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error fetching catalogs: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
