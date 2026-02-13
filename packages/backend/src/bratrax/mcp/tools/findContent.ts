import {
    AnyType,
    toolFindContentArgsSchema,
    type ToolFindContentArgs,
} from '@lightdash/common';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerFindContentTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.FIND_CONTENT,
        {
            description: toolFindContentArgsSchema.description,
            inputSchema: ctx.compatSchema(toolFindContentArgsSchema),
        },
        async (_args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            const args = _args as Omit<ToolFindContentArgs, 'type'>;
            const projectUuid = await ctx.resolveProjectUuid(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.FIND_CONTENT,
                projectUuid,
            );

            await ctx.requireProjectAccess(pctx, projectUuid);
            const { user } = pctx.authInfo!.extra;

            const searchLabel = args.searchQueries?.[0]?.label ?? '';

            const dashboards = await ctx.searchModel.searchDashboards(
                projectUuid,
                searchLabel,
                undefined,
                'OR',
            );
            const charts = await ctx.searchModel.searchAllCharts(
                projectUuid,
                searchLabel,
                'OR',
            );

            const allContent = [...dashboards, ...charts];
            const filtered = await ctx.spaceService.filterBySpaceAccess(
                user,
                allContent,
            );

            const dashboardUuids = new Set(
                dashboards.map((d) => d.uuid),
            );
            const enriched = filtered.map((item) => {
                const id = (item as { uuid: string }).uuid;
                const type = dashboardUuids.has(id) ? 'dashboards' : 'saved';
                return {
                    ...item,
                    url: id
                        ? `${ctx.config.siteUrl}/projects/${projectUuid}/${type}/${id}`
                        : undefined,
                };
            });

            return ctx.textResult(
                JSON.stringify({ content: enriched }, null, 2),
            );
        },
    );
}
