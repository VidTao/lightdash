import {
    AnyType,
    toolSearchFieldValuesArgsSchema,
    type ToolSearchFieldValuesArgs,
} from '@lightdash/common';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerSearchFieldValuesTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.SEARCH_FIELD_VALUES,
        {
            description: toolSearchFieldValuesArgsSchema.description,
            inputSchema: ctx.compatSchema(toolSearchFieldValuesArgsSchema),
        },
        async (_args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            const args = _args as Omit<ToolSearchFieldValuesArgs, 'type'>;
            const projectUuid = await ctx.resolveProjectUuid(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.SEARCH_FIELD_VALUES,
                projectUuid,
            );

            await ctx.requireProjectAccess(pctx, projectUuid);
            const { user } = pctx.authInfo!.extra;
            const attrOverrides = await ctx.getUserAttributeOverrides(pctx);

            const dimensionFilters = args.filters?.dimensions;
            let andFilters: AnyType;
            if (dimensionFilters) {
                if ('and' in dimensionFilters) {
                    andFilters = dimensionFilters;
                } else if (Array.isArray(dimensionFilters)) {
                    andFilters = {
                        id: 'mcp-search-filter',
                        and: dimensionFilters,
                    };
                }
            }

            const results =
                await ctx.projectService.searchFieldUniqueValues(
                    user,
                    projectUuid,
                    args.table,
                    args.fieldId,
                    args.query ?? '',
                    100,
                    andFilters,
                    false,
                    undefined,
                    attrOverrides,
                );

            return ctx.textResult(JSON.stringify(results, null, 2));
        },
    );
}
