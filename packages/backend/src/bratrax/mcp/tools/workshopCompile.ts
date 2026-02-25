import { compileProject } from '../../bratraxShared';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

/**
 * Ontology generation guidance (from forward-deployed engineer review):
 *
 * 1. Always resolve backing refs to actual catalog $sources.* refs --
 *    don't leave properties unbacked when source fields exist.
 * 2. Check ALL streams per webhook source -- webhooks often have multiple
 *    source_table values creating distinct streams (e.g. slack_app has
 *    both payment_deliveries and slack_delivery).
 * 3. Domain objects should match the business model -- Lead types
 *    (retainer vs PPL) are distinct objects, not one generic lead.
 * 4. Multi-source objects are common -- campaigns come from Facebook AND
 *    Google; use array backing refs (backing: [{source, field}, ...]).
 * 5. Naming convention parsing is a real pattern -- allocation_id embedded
 *    in campaign names is common in ad-tech.
 * 6. Computed/aggregated fields -- daily metrics roll up into parent object
 *    totals (campaign.total_spend = SUM(daily_metrics.spend)).
 * 7. Webhook payloads may nest data -- check for data.* nested fields;
 *    discovery may need flattened payloads.
 * 8. Don't duplicate backing refs -- conversions and leads_count should
 *    NOT both map to the same source field (e.g. actions).
 */

export function registerWorkshopCompileTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WORKSHOP_COMPILE,
        {
            title: TOOL_TITLES[BratraxMcpToolName.WORKSHOP_COMPILE],
            description:
                'Compile the ontology for the current project. ' +
                'Reads YAML from DB, validates, then generates ' +
                'Dataform .sqlx models and Meltano config. Returns artifact list with content. ' +
                'Multi-source backing is supported: use backing as an array ' +
                '[{source, field, transform?}, ...] for properties backed by multiple sources ' +
                '(e.g. Facebook + Google campaigns).',
            inputSchema: {},
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.WORKSHOP_COMPILE],
        },
        async (_args: Record<string, never>, extra) => {
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.WORKSHOP_COMPILE);
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                await ctx.requireProjectAccess(pctx, projectUuid);
                const data = await compileProject(
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
                            text: `Error compiling ontology: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
