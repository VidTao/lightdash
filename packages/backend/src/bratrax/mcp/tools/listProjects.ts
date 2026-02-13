import { wrapSentryTransaction } from '../../../utils';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerListProjectsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.LIST_PROJECTS,
        {
            description: 'List all accessible projects in the organization',
            inputSchema: {},
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            const { organizationUuid } = ctx.getAccount(pctx);
            ctx.trackToolCall(pctx, BratraxMcpToolName.LIST_PROJECTS);

            const projects = await wrapSentryTransaction(
                'BratraxMcp.listProjects',
                { organizationUuid },
                async () =>
                    ctx.projectModel.getAllByOrganizationUuid(
                        organizationUuid,
                    ),
            );

            const list = projects.map((p) => ({
                name: p.name,
                projectUuid: p.projectUuid,
            }));

            return ctx.textResult(JSON.stringify(list, null, 2));
        },
    );
}
