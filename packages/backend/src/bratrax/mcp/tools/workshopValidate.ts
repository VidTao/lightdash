import {
    getBratraxOntologyModel,
    validateYaml,
} from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWorkshopValidateTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_VALIDATE,
        {
            description:
                'Validate the ontology for the current project. ' +
                'Reads YAML from DB, parses, resolves $ref references, ' +
                'and runs all validation rules. Returns errors and warnings.',
            inputSchema: {},
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_VALIDATE,
            );
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const model = getBratraxOntologyModel(ctx.services);
                const files = await model.getFiles(projectUuid);
                const data = await validateYaml({
                    config: files.config ?? '',
                    ontology: files.ontology ?? '',
                    sources: files.sources ?? '',
                    tracking_plan: files.tracking_plan ?? '',
                });
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
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
