import { validateProject } from '../../bratraxShared';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWorkshopValidateTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_VALIDATE,
        {
            title: TOOL_TITLES[BratraxMcpToolName.WORKSHOP_VALIDATE],
            description:
                'Validate the ontology for the current project. Reads YAML from DB, resolves $ref references, and runs all validation rules. Must pass before compilation. Returns errors, warnings, and a summary.',
            inputSchema: {},
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.WORKSHOP_VALIDATE],
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.WORKSHOP_VALIDATE);
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const data = await validateProject(
                    projectUuid,
                    ctx.services,
                );
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error validating ontology: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
