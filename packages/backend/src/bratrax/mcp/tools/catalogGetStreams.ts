import { z } from 'zod';
import { getBratraxDiscoveryModel } from '../../../helpers/bratrax-api';
import {
    parseSingerCatalog,
    safeParseCatalogJson,
} from '../../../helpers/bratrax-catalog-parser';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerCatalogGetStreamsTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.CATALOG_GET_STREAMS,
        {
            description:
                'Get the list of streams (tables) available in a data source (Meltano tap or webhook source). ' +
                'Returns stream names, field counts, key properties, replication method, and source_type. ' +
                'Use catalog_list_taps first to find the source key.',
            inputSchema: ctx.compatSchema(
                z.object({
                    tap: z
                        .string()
                        .describe(
                            'Source key, e.g. "tap-shopify", "tap-facebook", "webhook-leadbyte"',
                        ),
                }),
            ),
        },
        async (rawArgs: Record<string, unknown>, extra) => {
            const { tap } = rawArgs as { tap: string };
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.CATALOG_GET_STREAMS);
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
                if (!entry) {
                    return {
                        content: [
                            {
                                type: 'text' as const,
                                text: `No streams found in tap '${tap}'.`,
                            },
                        ],
                        isError: true,
                    };
                }

                const result = {
                    tap: entry.tap,
                    label: entry.label,
                    category: entry.category,
                    source_name: entry.source_name,
                    raw_table: entry.raw_table,
                    source_type: entry.source_type,
                    streams: entry.streams.map((s) => ({
                        name: s.name,
                        field_count: s.fields.length,
                        key_properties: s.key_properties,
                        replication_method: s.replication_method,
                    })),
                };

                return ctx.textResult(JSON.stringify(result, null, 2));
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error fetching streams: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
