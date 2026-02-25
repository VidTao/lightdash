import { getBratraxOntologyModel } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWorkshopListClientsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_LIST_CLIENTS,
        {
            title: TOOL_TITLES[BratraxMcpToolName.WORKSHOP_LIST_CLIENTS],
            description:
                'Check the ontology status for the current project. Returns whether an ontology exists and which YAML files (config, ontology, sources, tracking_plan) are present.',
            inputSchema: {},
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.WORKSHOP_LIST_CLIENTS],
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
