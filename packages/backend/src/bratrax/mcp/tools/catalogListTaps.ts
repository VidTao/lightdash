import { getBratraxDiscoveryModel } from '../../../helpers/bratrax-api';
import {
    parseSingerCatalog,
    safeParseCatalogJson,
} from '../../../helpers/bratrax-catalog-parser';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerCatalogListTapsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.CATALOG_LIST_TAPS,
        {
            title: TOOL_TITLES[BratraxMcpToolName.CATALOG_LIST_TAPS],
            description:
                'List all available data sources (Meltano Singer taps and webhook-discovered sources) with stream counts and categories. ' +
                'Each entry includes a source_type ("meltano" or "webhook") so you can distinguish how data is ingested. ' +
                'Use this to discover what data sources are available before drilling into streams or fields.',
            inputSchema: {},
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.CATALOG_LIST_TAPS],
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.CATALOG_LIST_TAPS);
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                await ctx.requireProjectAccess(pctx, projectUuid);
                const discoveryModel = getBratraxDiscoveryModel(ctx.services);
                const rows =
                    await discoveryModel.getCatalogsForProject(projectUuid);

                const taps: Array<{
                    tap: string;
                    label: string;
                    category: string;
                    source_name: string;
                    source_type: string;
                    stream_count: number;
                }> = [];

                for (const row of rows) {
                    const catalogJson = safeParseCatalogJson(row.catalog_json);
                    if (catalogJson) {
                        const entry = parseSingerCatalog(
                            row.source_key,
                            catalogJson,
                        );
                        if (entry) {
                            taps.push({
                                tap: entry.tap,
                                label: entry.label,
                                category: entry.category,
                                source_name: entry.source_name,
                                source_type: entry.source_type,
                                stream_count: entry.streams.length,
                            });
                        }
                    }
                }

                return ctx.textResult(JSON.stringify(taps, null, 2));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
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
