import {
    AnyType,
    type CreateDashboardWithCharts,
    type CreateSavedChart,
    toolDashboardV2ArgsSchema,
    toolDashboardV2ArgsSchemaTransformed,
    type ToolDashboardV2ArgsTransformed,
} from '@lightdash/common';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';
import { ExploreContext } from '../utils/exploreContext';

export function registerGenerateDashboardTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.GENERATE_DASHBOARD,
        {
            title: TOOL_TITLES[BratraxMcpToolName.GENERATE_DASHBOARD],
            description: toolDashboardV2ArgsSchema.description,
            inputSchema: ctx.compatSchema(toolDashboardV2ArgsSchema),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.GENERATE_DASHBOARD],
        },
        async (_args: AnyType, extra: AnyType) => {
            const pctx = extra as McpProtocolContext;
            const projectUuid = await ctx.resolveProjectUuid(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.GENERATE_DASHBOARD,
                projectUuid,
            );

            try {
                const { user } = pctx.authInfo!.extra;
                await ctx.requireProjectAccess(pctx, projectUuid);

                const args: ToolDashboardV2ArgsTransformed =
                    toolDashboardV2ArgsSchemaTransformed.parse({
                        ..._args,
                        projectUuid,
                    });

                const tags = await ctx.getTagsFromContext(pctx);
                const attrOverrides =
                    await ctx.getUserAttributeOverrides(pctx);
                const explores = await ctx.getAvailableExplores(
                    user,
                    projectUuid,
                    tags,
                    attrOverrides,
                );
                const exploreCtx = new ExploreContext(explores);

                const space =
                    await ctx.spaceModel.getFirstAccessibleSpace(
                        projectUuid,
                        user.userUuid,
                    );

                const vizResults = await Promise.allSettled(
                    args.visualizations.map(async (viz, idx) => {
                        const explore = exploreCtx.getExplore(
                            viz.queryConfig.exploreName,
                        );
                        const metricQuery = ctx.buildMetricQueryFromViz(
                            viz,
                            explore,
                        );

                        const chartType = ctx.mapChartType(
                            viz.chartConfig?.defaultVizType,
                        );

                        const chart: CreateSavedChart = {
                            name: viz.title || `Chart ${idx + 1}`,
                            description: viz.description || undefined,
                            tableName: viz.queryConfig.exploreName,
                            metricQuery,
                            chartConfig: ctx.buildChartConfig(
                                chartType,
                                viz.chartConfig?.defaultVizType,
                                viz.queryConfig.dimensions,
                                viz.queryConfig.metrics,
                            ),
                            tableConfig: {
                                columnOrder: [],
                            },
                            pivotConfig: undefined,
                            parameters: undefined,
                            dashboardUuid: null as unknown as string,
                        };
                        return chart;
                    }),
                );

                const validCharts: CreateSavedChart[] = [];
                const errors: string[] = [];

                vizResults.forEach((result, idx) => {
                    if (result.status === 'fulfilled') {
                        validCharts.push(result.value);
                    } else {
                        const msg =
                            result.reason instanceof Error
                                ? result.reason.message
                                : String(result.reason);
                        errors.push(`Visualization ${idx + 1}: ${msg}`);
                    }
                });

                if (validCharts.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: `Failed to create dashboard. All visualizations had errors:\n${errors.join('\n')}`,
                            },
                        ],
                        isError: true,
                    };
                }

                const dashboardData: CreateDashboardWithCharts = {
                    name: args.title,
                    description: args.description,
                    spaceUuid: space.space_uuid,
                    charts: validCharts,
                };

                const dashboardService =
                    ctx.services.getDashboardService();
                const dashboard =
                    await dashboardService.createDashboardWithCharts(
                        user,
                        projectUuid,
                        dashboardData,
                    );

                const dashboardUrl = `${ctx.config.siteUrl}/projects/${projectUuid}/dashboards/${dashboard.uuid}`;

                const result: Record<string, unknown> = {
                    dashboardUuid: dashboard.uuid,
                    dashboardUrl,
                    name: dashboard.name,
                    chartsCreated: validCharts.length,
                    totalRequested: args.visualizations.length,
                };

                if (errors.length > 0) {
                    result.errors = errors;
                }

                return ctx.textResult(JSON.stringify(result, null, 2));
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error generating dashboard: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
