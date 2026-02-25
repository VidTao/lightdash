import { AnyType, mcpToolListExploresArgsSchema } from '@lightdash/common';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerListExploresTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.LIST_EXPLORES,
        {
            title: TOOL_TITLES[BratraxMcpToolName.LIST_EXPLORES],
            description: mcpToolListExploresArgsSchema.description,
            inputSchema: ctx.compatSchema(mcpToolListExploresArgsSchema),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.LIST_EXPLORES],
        },
        async (_args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            const { user } = ctx.getAccount(pctx);
            const projectUuid = await ctx.resolveProjectUuid(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.LIST_EXPLORES,
                projectUuid,
            );

            const tags = await ctx.getTagsFromContext(pctx);
            const attrOverrides = await ctx.getUserAttributeOverrides(pctx);
            const explores = await ctx.getAvailableExplores(
                user,
                projectUuid,
                tags,
                attrOverrides,
            );

            const summary = explores.map((e) => ({
                name: e.name,
                label: e.label,
                description: e.tables[e.baseTable]?.description,
                tags: e.tags,
            }));

            return ctx.textResult(JSON.stringify(summary, null, 2));
        },
    );
}
