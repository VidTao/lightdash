import { AnyType } from '@lightdash/common';
import { z } from 'zod';
import {
    getBratraxOntologyModel,
    getTemplate,
} from '../../../helpers/bratrax-api';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

const inputSchema = z
    .object({
        template: z
            .string()
            .optional()
            .describe(
                'Template stack to initialize from (e.g. "shopify-paid-media"). ' +
                    'If omitted, creates blank YAML stubs.',
            ),
    })
    .describe(
        'Initialize the ontology for the current project from a stack template. ' +
            'Creates config.yaml, ontology.yaml, sources.yaml, and tracking_plan.yaml in the database.',
    );

const BLANK_FILES: Record<string, string> = {
    config: 'template_id: blank\ndisplay_name: ""\ndescription: ""\n',
    ontology: 'version: "1.0"\nnamespace: ""\nobjects: {}\nlinks: {}\nmetrics: {}\n',
    sources: 'version: "1.0"\nnamespace: ""\nsources: {}\n',
    tracking_plan: 'version: "1.0"\nnamespace: ""\ncategories: {}\nevents: {}\n',
};

export function registerWorkshopCreateClientTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_CREATE_CLIENT,
        {
            title: TOOL_TITLES[BratraxMcpToolName.WORKSHOP_CREATE_CLIENT],
            description: inputSchema.description!,
            inputSchema: ctx.compatSchema(inputSchema),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.WORKSHOP_CREATE_CLIENT],
        },
        async (args: AnyType, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WORKSHOP_CREATE_CLIENT,
            );
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const model = getBratraxOntologyModel(ctx.services);

                let files: Record<string, string>;
                if (args.template) {
                    const tmpl = await getTemplate(args.template);
                    files = tmpl.files ?? BLANK_FILES;
                } else {
                    files = BLANK_FILES;
                }

                await model.createFromTemplate(projectUuid, files);
                return ctx.textResult(
                    JSON.stringify(
                        {
                            project_uuid: projectUuid,
                            initialized: true,
                            files: Object.keys(files),
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
                            text: `Error initializing ontology: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
