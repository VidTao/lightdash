import { z } from 'zod';
import { getBratraxDiscoveryModel } from '../../../helpers/bratrax-api';
import {
    parseSingerCatalog,
    safeParseCatalogJson,
    searchParsedCatalogs,
    type CatalogEntry,
} from '../../../helpers/bratrax-catalog-parser';
import { buildPaginationMeta } from '../paginationTypes';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerCatalogSearchFieldsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.CATALOG_SEARCH_FIELDS,
        {
            title: TOOL_TITLES[BratraxMcpToolName.CATALOG_SEARCH_FIELDS],
            description:
                'Search for fields by name across all data sources (Meltano taps and webhook sources). ' +
                'Returns matching fields with their tap, stream, type, source_type, and $sources.* ref. ' +
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
                    page: z
                        .number()
                        .optional()
                        .describe('Page number (1-based, default 1)'),
                    pageSize: z
                        .number()
                        .optional()
                        .describe('Results per page (default 20, max 100)'),
                }),
            ),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.CATALOG_SEARCH_FIELDS],
        },
        async (rawArgs: Record<string, unknown>, extra) => {
            const { query, type: typeFilter, page: rawPage, pageSize: rawPageSize } = rawArgs as {
                query: string;
                type?: string;
                page?: number;
                pageSize?: number;
            };
            const page = rawPage ?? 1;
            const pageSize = Math.min(rawPageSize ?? 20, 100);
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.CATALOG_SEARCH_FIELDS);
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const discoveryModel = getBratraxDiscoveryModel(ctx.services);
                const rows =
                    await discoveryModel.getCatalogsForProject(projectUuid);

                const catalogs: CatalogEntry[] = [];
                for (const row of rows) {
                    const catalogJson = safeParseCatalogJson(row.catalog_json);
                    if (catalogJson) {
                        const entry = parseSingerCatalog(
                            row.source_key,
                            catalogJson,
                        );
                        if (entry) {
                            catalogs.push(entry);
                        }
                    }
                }

                const results = searchParsedCatalogs(
                    catalogs,
                    query,
                    typeFilter,
                    pageSize,
                );

                return ctx.textResult(
                    JSON.stringify(
                        {
                            query,
                            results,
                            pagination: buildPaginationMeta(page, pageSize, results.length),
                        },
                        null,
                        2,
                    ),
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
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
