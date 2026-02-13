import { VERSION } from '../../../version';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerGetVersionTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.GET_LIGHTDASH_VERSION,
        {
            description: 'Get the current Lightdash version',
            inputSchema: {},
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
