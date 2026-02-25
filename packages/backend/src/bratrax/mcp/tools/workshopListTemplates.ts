import { listTemplates } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWorkshopListTemplatesTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_LIST_TEMPLATES,
        {
            title: TOOL_TITLES[BratraxMcpToolName.WORKSHOP_LIST_TEMPLATES],
            description:
                'List available Bratrax stack templates. ' +
                'Templates provide pre-configured YAML files for common setups ' +
                '(e.g. shopify-paid-media).',
            inputSchema: {},
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.WORKSHOP_LIST_TEMPLATES],
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_LIST_TEMPLATES,
            );
            ctx.canAccessMcp(pctx);

            try {
                const data = await listTemplates();
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error listing templates: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
