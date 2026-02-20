import { getBratraxDiscoveryModel } from '../../../helpers/bratrax-api';
import {
    parseSingerCatalog,
    safeParseCatalogJson,
    type CatalogEntry,
} from '../../../helpers/bratrax-catalog-parser';
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
                const projectUuid = await ctx.resolveProjectUuid(pctx);
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
