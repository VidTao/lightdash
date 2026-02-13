import {
    AnyType,
    AiResultType,
    getItemLabelWithoutTableName,
    getSlackAiEchartsConfig,
    QueryExecutionContext,
    toolRunQueryArgsSchema,
    toolRunQueryArgsSchemaTransformed,
} from '@lightdash/common';
// eslint-disable-next-line import/extensions
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
    ServerNotification,
    ServerRequest,
    // eslint-disable-next-line import/extensions
} from '@modelcontextprotocol/sdk/types.js';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs/promises';
import path from 'path';
import { CsvService } from '../../../services/CsvService/CsvService';
import {
    registerAppResource,
    registerAppTool,
    RESOURCE_MIME_TYPE,
} from '../mcpAppHelpers';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';
import { ExploreContext } from '../utils/exploreContext';
import { populateCustomMetricsSQL } from '../utils/customMetrics';
import { serializeData } from '../utils/serializeData';
import { pivotResults } from '../utils/pivotResults';

const NO_RESULTS_MESSAGE =
    'The query returned 0 results. Please review the filters and try different criteria. Consider broadening the date range, removing restrictive filters, or verifying field values with the search_field_values tool.';

export function registerRunMetricQueryTool(ctx: McpToolContext): void {
    // Register chart app resource for MCP App UI
    const chartResourceUri = 'ui://run-metric-query/chart.html';
    registerAppResource(
        ctx.server,
        chartResourceUri,
        chartResourceUri,
        { mimeType: RESOURCE_MIME_TYPE },
        async () => {
            const htmlPath = path.join(
                __dirname,
                '..',
                'mcp-chart-app',
                'dist',
                'chart-app.html',
            );
            const html = await fs.readFile(htmlPath, 'utf-8');
            return {
                contents: [
                    {
                        uri: chartResourceUri,
                        mimeType: RESOURCE_MIME_TYPE,
                        text: html,
                    },
                ],
            };
        },
    );

    registerAppTool(
        ctx.server,
        BratraxMcpToolName.RUN_METRIC_QUERY,
        {
            description: toolRunQueryArgsSchema.description,
            inputSchema: ctx.compatSchema(toolRunQueryArgsSchema),
            _meta: { ui: { resourceUri: chartResourceUri } },
        },
        async (
            _args: AnyType,
            extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
        ) => {
            const pctx = extra as McpProtocolContext;
            const projectUuid = await ctx.resolveProjectUuid(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.RUN_METRIC_QUERY,
                projectUuid,
            );

            try {
                const { user, account } = pctx.authInfo!.extra;
                await ctx.requireProjectAccess(pctx, projectUuid);

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

                const queryTool = toolRunQueryArgsSchemaTransformed.parse({
                    ..._args,
                    projectUuid,
                });

                const explore = exploreCtx.getExplore(
                    queryTool.queryConfig.exploreName,
                );

                const metricQuery = ctx.buildMetricQueryFromViz(
                    queryTool,
                    explore,
                );

                const results =
                    await ctx.asyncQueryService.executeMetricQueryAndGetResults(
                        {
                            account,
                            projectUuid,
                            metricQuery: {
                                ...metricQuery,
                                additionalMetrics: populateCustomMetricsSQL(
                                    queryTool.customMetrics,
                                    explore,
                                ),
                            },
                            context: QueryExecutionContext.MCP,
                        },
                    );

                if (results.rows.length === 0) {
                    return {
                        content: [
                            { type: 'text' as const, text: NO_RESULTS_MESSAGE },
                        ],
                    };
                }

                // Build CSV for text-based clients
                const fieldIds = Object.keys(results.rows[0]);
                const csvHeaders = fieldIds.map((id) => {
                    const item = results.fields[id];
                    if (!item) return id;
                    return getItemLabelWithoutTableName(item);
                });
                const csvRows = results.rows.map((row) =>
                    CsvService.convertRowToCsv(
                        row,
                        results.fields,
                        true,
                        fieldIds,
                    ),
                );
                const csv = stringify(csvRows, {
                    header: true,
                    columns: csvHeaders,
                });

                // Generate ECharts config for interactive chart display
                const echartsOption = await getSlackAiEchartsConfig({
                    toolArgs: {
                        type: AiResultType.QUERY_RESULT,
                        tool: queryTool,
                    },
                    queryResults: {
                        rows: results.rows,
                        fields: results.fields,
                    },
                    getPivotedResults: pivotResults,
                });

                const mcpEchartsOption = echartsOption
                    ? {
                          ...echartsOption,
                          animation: true,
                          backgroundColor: 'transparent',
                          tooltip: {
                              ...(typeof echartsOption.tooltip === 'object'
                                  ? echartsOption.tooltip
                                  : {}),
                              show: true,
                          },
                      }
                    : null;

                // Build "Explore from here" URL
                const exploreState = {
                    tableName: queryTool.queryConfig.exploreName,
                    metricQuery: {
                        exploreName: queryTool.queryConfig.exploreName,
                        dimensions: queryTool.queryConfig.dimensions,
                        metrics: queryTool.queryConfig.metrics,
                        sorts: queryTool.queryConfig.sorts,
                        limit: metricQuery.limit,
                        filters: queryTool.filters ?? {},
                        additionalMetrics: metricQuery.additionalMetrics,
                        tableCalculations: metricQuery.tableCalculations,
                    },
                    tableConfig: {
                        columnOrder: Object.keys(results.rows[0] ?? {}),
                    },
                    chartConfig: {
                        type: 'table' as const,
                        config: {
                            showColumnCalculation: false,
                            showRowCalculation: false,
                            showTableNames: true,
                            showResultsTotal: false,
                            showSubtotals: false,
                            columns: {},
                            hideRowNumbers: false,
                            conditionalFormattings: [],
                            metricsAsRows: false,
                        },
                    },
                };
                const explorePath = `/projects/${projectUuid}/tables/${queryTool.queryConfig.exploreName}`;
                const exploreParams = `?create_saved_chart_version=${encodeURIComponent(JSON.stringify(exploreState))}&isExploreFromHere=true`;
                const exploreUrl = `${ctx.config.siteUrl}${explorePath}${exploreParams}`;

                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: serializeData(csv, 'csv'),
                        },
                    ],
                    structuredContent: {
                        rows: results.rows,
                        fields: results.fields,
                        echartsOption: mcpEchartsOption,
                        exploreUrl,
                    },
                };
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error running metric query: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
