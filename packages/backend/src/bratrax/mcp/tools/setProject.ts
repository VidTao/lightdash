import { subject } from '@casl/ability';
import { AnyType, ForbiddenError, ParameterError } from '@lightdash/common';
import { z } from 'zod';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerSetProjectTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.SET_PROJECT,
        {
            title: TOOL_TITLES[BratraxMcpToolName.SET_PROJECT],
            description:
                'Set the active project for subsequent MCP operations',
            inputSchema: ctx.compatSchema(
                z.object({
                    projectUuid: z.string(),
                    tags: z.array(z.string()).optional(),
                }),
            ),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.SET_PROJECT],
        },
        async (_args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            const args = _args as { projectUuid: string; tags?: string[] };
            const { user, organizationUuid, account } = ctx.getAccount(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.SET_PROJECT,
                args.projectUuid,
            );

            if (!args.projectUuid) {
                throw new ParameterError('Project UUID is required');
            }

            const project = await ctx.projectService.getProject(
                args.projectUuid,
                account,
            );

            if (
                user.ability.cannot(
                    'view',
                    subject('Project', {
                        projectUuid: args.projectUuid,
                        organizationUuid: project.organizationUuid,
                    }),
                )
            ) {
                throw new ForbiddenError(
                    'You do not have access to this project',
                );
            }

            const tagsToSet =
                args.tags !== undefined && args.tags.length > 0
                    ? args.tags
                    : null;

            await ctx.mcpContextModel.setContext({
                userUuid: user.userUuid,
                organizationUuid,
                context: {
                    projectUuid: args.projectUuid,
                    projectName: project.name,
                    tags: tagsToSet,
                },
            });

            return ctx.textResult(
                JSON.stringify(
                    {
                        projectUuid: args.projectUuid,
                        projectName: project.name,
                        selectedTags: tagsToSet,
                    },
                    null,
                    2,
                ),
            );
        },
    );
}
