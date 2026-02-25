import { VERSION } from '../../../version';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerGetVersionTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.GET_LIGHTDASH_VERSION,
        {
            title: TOOL_TITLES[BratraxMcpToolName.GET_LIGHTDASH_VERSION],
            description: 'Get the current Lightdash version',
            inputSchema: {},
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.GET_LIGHTDASH_VERSION],
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.GET_LIGHTDASH_VERSION,
            );
            ctx.canAccessMcp(pctx);
            return ctx.textResult(VERSION);
        },
    );
}
