import { z } from 'zod';
import { getBratraxDiscoveryModel } from '../../../helpers/bratrax-api';
import {
    parseSingerCatalog,
    safeParseCatalogJson,
} from '../../../helpers/bratrax-catalog-parser';
import type { McpToolContext } from '../toolContext';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWebhookDiscoveryStatusTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WEBHOOK_DISCOVERY_STATUS,
        {
            description:
                'Check if a webhook source has been discovered for this project. ' +
                'Returns whether the source exists in the catalog, plus stream and field counts. ' +
                'Use this before and after webhook_introspect to verify discovery status.',
            inputSchema: ctx.compatSchema(
                z.object({
                    source: z
                        .string()
                        .describe(
                            'Source name without "webhook-" prefix (e.g. "leadbyte", "slack-app", "stripe")',
                        ),
                }),
            ),
        },
        async (rawArgs: Record<string, unknown>, extra) => {
            const { source } = rawArgs as { source: string };
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.WEBHOOK_DISCOVERY_STATUS,
            );
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const discoveryModel = getBratraxDiscoveryModel(ctx.services);
                const sourceKey = `webhook-${source}`;

                const row = await discoveryModel.getCatalog(
                    projectUuid,
                    sourceKey,
                );

                if (!row) {
                    return ctx.textResult(
                        JSON.stringify(
                            {
                                discovered: false,
                                source,
                                source_key: sourceKey,
                                streams: 0,
                                fields: 0,
                            },
                            null,
                            2,
                        ),
                    );
                }

                const catalogJson = safeParseCatalogJson(row.catalog_json);
                if (!catalogJson) {
                    return ctx.textResult(
                        JSON.stringify(
                            {
                                discovered: false,
                                source,
                                source_key: sourceKey,
                                streams: 0,
                                fields: 0,
                                note: 'Catalog row exists but JSON is unparseable',
                            },
                            null,
                            2,
                        ),
                    );
                }

                const entry = parseSingerCatalog(sourceKey, catalogJson);
                const totalFields =
                    entry?.streams.reduce(
                        (sum, s) => sum + s.fields.length,
                        0,
                    ) ?? 0;

                return ctx.textResult(
                    JSON.stringify(
                        {
                            discovered: true,
                            source,
                            source_key: sourceKey,
                            label: entry?.label ?? sourceKey,
                            streams: entry?.streams.length ?? 0,
                            fields: totalFields,
                        },
                        null,
                        2,
                    ),
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                return {
                    content: [
                        {
                            type: 'text' as const,
                            text: `Error checking webhook discovery status: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
