import { listClients } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWorkshopListClientsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_LIST_CLIENTS,
        {
            description:
                'List all Bratrax clients with their YAML file status. ' +
                'Returns each client name and which of the 4 YAML files exist.',
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
                const data = await listClients();
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error listing clients: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
