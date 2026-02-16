import { AnyType } from '@lightdash/common';
import { z } from 'zod';
import { writeClientYaml } from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

const inputSchema = z
    .object({
        client_name: z
            .string()
            .describe('Name of the client to write to'),
        file: z
            .enum(['config', 'ontology', 'sources', 'tracking_plan'])
            .describe('Which YAML file to write'),
        content: z
            .string()
            .describe(
                'Full YAML content to write. Must be valid YAML syntax.',
            ),
    })
    .describe(
        'Write a specific YAML file for a Bratrax client. ' +
            'Validates YAML syntax before writing. ' +
            'The entire file content is replaced.',
    );

export function registerWorkshopWriteYamlTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_WRITE_YAML,
        {
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_WRITE_YAML,
            );
            ctx.canAccessMcp(pctx);

            try {
                const data = await writeClientYaml(
                    args.client_name,
                    args.file,
                    args.content,
                );
                return ctx.textResult(JSON.stringify(data, null, 2));
            } catch (e: unknown) {
                const msg =
                    e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error writing YAML: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
