import { getBratraxOntologyModel } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWorkshopListClientsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_LIST_CLIENTS,
        {
            description:
                'Check if the current project has an ontology set up. ' +
                'Returns whether an ontology exists and which YAML files are present.',
            inputSchema: {},
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_LIST_CLIENTS,
            );
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const model = getBratraxOntologyModel(ctx.services);
                const files = await model.getFiles(projectUuid);
                const fileKeys = Object.keys(files);
                return ctx.textResult(
                    JSON.stringify(
                        {
                            project_uuid: projectUuid,
                            has_ontology: fileKeys.length > 0,
                            files: fileKeys,
                        },
                        null,
                        2,
                    ),
                );
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error checking ontology: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
