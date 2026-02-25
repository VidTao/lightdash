import {
    AnyType,
    CatalogType,
    NotFoundError,
    toolFindFieldsArgsSchema,
    type ToolFindFieldsArgs,
} from '@lightdash/common';
import { CatalogSearchContext } from '../../../models/CatalogModel/CatalogModel';
import { buildPaginationMeta } from '../paginationTypes';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerFindFieldsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.FIND_FIELDS,
        {
            title: TOOL_TITLES[BratraxMcpToolName.FIND_FIELDS],
            description: toolFindFieldsArgsSchema.description,
            inputSchema: ctx.compatSchema(toolFindFieldsArgsSchema),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.FIND_FIELDS],
        },
        async (_args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            const args = _args as Omit<ToolFindFieldsArgs, 'type'>;
            const projectUuid = await ctx.resolveProjectUuid(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.FIND_FIELDS,
                projectUuid,
            );

            await ctx.requireProjectAccess(pctx, projectUuid);
            const tags = await ctx.getTagsFromContext(pctx);
            const userAttrs = await ctx.getMergedUserAttributes(pctx);
            const attrOverrides = await ctx.getUserAttributeOverrides(pctx);

            const explores = await ctx.getAvailableExplores(
                pctx.authInfo!.extra.user,
                projectUuid,
                tags,
                attrOverrides,
            );
            const explore = explores.find((e) => e.name === args.table);
            if (!explore) {
                throw new NotFoundError(`Explore '${args.table}' not found`);
            }

            const searchLabel = args.fieldSearchQueries?.[0]?.label ?? '';
            const pageSize = 15;

            const { data: catalogItems, pagination } =
                await ctx.catalogService.searchCatalog({
                    projectUuid,
                    catalogSearch: {
                        type: CatalogType.Field,
                        searchQuery: searchLabel,
                    },
                    context: CatalogSearchContext.MCP,
                    paginateArgs: {
                        page: args.page ?? 1,
                        pageSize,
                    },
                    userAttributes: userAttrs,
                    fullTextSearchOperator: 'OR',
                    filteredExplores: [explore],
                });

            const fields = catalogItems.filter(
                (item) => item.type === CatalogType.Field,
            );

            const paginationMeta = pagination
                ? buildPaginationMeta(pagination.page, pagination.pageSize, pagination.totalResults)
                : undefined;

            return ctx.textResult(
                JSON.stringify({ fields, pagination: paginationMeta }, null, 2),
            );
        },
    );
}
