import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerGetCurrentProjectTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.GET_CURRENT_PROJECT,
        {
            title: TOOL_TITLES[BratraxMcpToolName.GET_CURRENT_PROJECT],
            description: 'Get the active project context including project name, UUID, and selected tags. Returns an error if no project is set.',
            inputSchema: {},
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.GET_CURRENT_PROJECT],
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            const { user, organizationUuid } = ctx.getAccount(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.GET_CURRENT_PROJECT,
            );

            const row = await ctx.mcpContextModel.getContext(
                user.userUuid,
                organizationUuid,
            );

            if (!row || !row.context.projectUuid) {
                return ctx.textResult(
                    JSON.stringify(
                        {
                            error: 'No active project set. Use set_project to set one.',
                        },
                        null,
                        2,
                    ),
                );
            }

            return ctx.textResult(
                JSON.stringify(
                    {
                        projectUuid: row.context.projectUuid,
                        projectName: row.context.projectName,
                        selectedTags: row.context.tags,
                    },
                    null,
                    2,
                ),
            );
        },
    );
}
