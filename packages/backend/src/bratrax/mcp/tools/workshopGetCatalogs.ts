import { getBratraxDiscoveryModel } from '../../../helpers/bratrax-api';
import {
    parseSingerCatalog,
    safeParseCatalogJson,
    type CatalogEntry,
} from '../../../helpers/bratrax-catalog-parser';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWorkshopGetCatalogsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_GET_CATALOGS,
        {
            title: TOOL_TITLES[BratraxMcpToolName.WORKSHOP_GET_CATALOGS],
            description:
                'Get all discovered data source catalogs (Meltano taps and webhook sources) for the current project. Returns taps with their streams and field schemas. Use during ontology workshops to discover available data for mapping.',
            inputSchema: {},
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.WORKSHOP_GET_CATALOGS],
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_GET_CATALOGS,
            );
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                await ctx.requireProjectAccess(pctx, projectUuid);
                const discoveryModel = getBratraxDiscoveryModel(
                    ctx.services,
                );
                const rows =
                    await discoveryModel.getCatalogsForProject(projectUuid);

                const catalogs: CatalogEntry[] = [];
                for (const row of rows) {
                    const catalogJson = safeParseCatalogJson(
                        row.catalog_json,
                    );
                    if (!catalogJson) continue;
                    const entry = parseSingerCatalog(
                        row.source_key,
                        catalogJson,
                    );
                    if (entry) {
                        catalogs.push(entry);
                    }
                }

                return ctx.textResult(
                    JSON.stringify({ catalogs }, null, 2),
                );
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
