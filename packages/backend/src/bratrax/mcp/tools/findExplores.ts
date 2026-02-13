import {
    AnyType,
    CatalogType,
    toolFindExploresArgsSchemaV3,
    type ToolFindExploresArgsV3,
} from '@lightdash/common';
import { CatalogSearchContext } from '../../../models/CatalogModel/CatalogModel';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerFindExploresTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.FIND_EXPLORES,
        {
            description: toolFindExploresArgsSchemaV3.description,
            inputSchema: ctx.compatSchema(toolFindExploresArgsSchemaV3),
        },
        async (_args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            const args = _args as Omit<ToolFindExploresArgsV3, 'type'>;
            const projectUuid = await ctx.resolveProjectUuid(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.FIND_EXPLORES,
                projectUuid,
            );

            await ctx.requireProjectAccess(pctx, projectUuid);
            const tags = await ctx.getTagsFromContext(pctx);
            const userAttrs = await ctx.getMergedUserAttributes(pctx);

            const tableResults = await ctx.catalogService.searchCatalog({
                projectUuid,
                userAttributes: userAttrs,
                catalogSearch: {
                    searchQuery: args.searchQuery,
                    type: CatalogType.Table,
                    catalogTags: tags || undefined,
                },
                context: CatalogSearchContext.MCP,
                paginateArgs: { page: 1, pageSize: 15 },
                fullTextSearchOperator: 'OR',
            });

            const exploreResults = tableResults.data
                .filter((item) => item.type === CatalogType.Table)
                .map((t) => ({
                    name: t.name,
                    label: t.label,
                    description: t.description,
                    aiHints: t.aiHints ?? undefined,
                    searchRank: t.searchRank,
                    joinedTables: t.joinedTables ?? undefined,
                }));

            const fieldResults = await ctx.catalogService.searchCatalog({
                projectUuid,
                userAttributes: userAttrs,
                catalogSearch: {
                    searchQuery: args.searchQuery,
                    type: CatalogType.Field,
                    catalogTags: tags || undefined,
                },
                context: CatalogSearchContext.MCP,
                paginateArgs: { page: 1, pageSize: 50 },
                fullTextSearchOperator: 'OR',
            });

            const topFields = fieldResults.data
                .filter((item) => item.type === CatalogType.Field)
                .map((f) => ({
                    name: f.name,
                    label: f.label,
                    tableName: f.tableName,
                    fieldType: f.fieldType,
                    searchRank: f.searchRank,
                    description: f.description,
                }));

            const output = {
                exploreSearchResults: exploreResults,
                topMatchingFields: topFields,
            };

            return ctx.textResult(JSON.stringify(output, null, 2));
        },
    );
}
