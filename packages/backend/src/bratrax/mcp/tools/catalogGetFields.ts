import { z } from 'zod';
import { getBratraxDiscoveryModel } from '../../../helpers/bratrax-api';
import {
    parseSingerCatalog,
    safeParseCatalogJson,
} from '../../../helpers/bratrax-catalog-parser';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerCatalogGetFieldsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.CATALOG_GET_FIELDS,
        {
            title: TOOL_TITLES[BratraxMcpToolName.CATALOG_GET_FIELDS],
            description:
                'Get the field schema for a specific stream within a data source (Meltano tap or webhook source). ' +
                'Returns field names, BigQuery types, nullable flags, source_type, and raw_table. ' +
                'Use catalog_get_streams first to find the stream name.',
            inputSchema: ctx.compatSchema(
                z.object({
                    tap: z
                        .string()
                        .describe(
                            'Source key, e.g. "tap-shopify", "tap-facebook", "webhook-leadbyte"',
                        ),
                    stream: z
                        .string()
                        .describe('Stream name, e.g. "orders", "campaigns"'),
                }),
            ),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.CATALOG_GET_FIELDS],
        },
        async (rawArgs: Record<string, unknown>, extra) => {
            const { tap, stream: streamName } = rawArgs as {
                tap: string;
                stream: string;
            };
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.CATALOG_GET_FIELDS);
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const discoveryModel = getBratraxDiscoveryModel(ctx.services);
                const row = await discoveryModel.getCatalog(projectUuid, tap);

                if (!row) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: `Tap '${tap}' not found. Use catalog_list_taps to see available taps.`,
                            },
                        ],
                        isError: true,
                    };
                }

                const catalogJson = safeParseCatalogJson(row.catalog_json);
                if (!catalogJson) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: `Invalid catalog data for tap '${tap}'.`,
                            },
                        ],
                        isError: true,
                    };
                }
                const entry = parseSingerCatalog(row.source_key, catalogJson);
                const stream = entry?.streams.find(
                    (s) => s.name === streamName,
                );

                if (!stream) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: `Stream '${streamName}' not found in tap '${tap}'. Use catalog_get_streams to see available streams.`,
                            },
                        ],
                        isError: true,
                    };
                }

                const result = {
                    tap,
                    stream: stream.name,
                    source_name: entry!.source_name,
                    source_type: entry!.source_type,
                    raw_table: entry!.raw_table,
                    key_properties: stream.key_properties,
                    replication_method: stream.replication_method,
                    fields: stream.fields,
                };

                return ctx.textResult(JSON.stringify(result, null, 2));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error fetching fields: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
