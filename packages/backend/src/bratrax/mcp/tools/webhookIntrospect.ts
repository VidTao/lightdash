import { z } from 'zod';
import {
    getBratraxDiscoveryModel,
    introspectWebhookPayload,
} from '../../../helpers/bratrax-api';
import {
    parseSingerCatalog,
    safeParseCatalogJson,
} from '../../../helpers/bratrax-catalog-parser';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

export function registerWebhookIntrospectTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.WEBHOOK_INTROSPECT,
        {
            title: TOOL_TITLES[BratraxMcpToolName.WEBHOOK_INTROSPECT],
            description:
                'Send a sample webhook payload to trigger schema discovery. ' +
                'The payload is introspected, merged with any existing catalog, and persisted. ' +
                'Call this for each stream/event type you want to discover. ' +
                'After calling, use webhook_discovery_status to verify the source is now available.',
            inputSchema: ctx.compatSchema(
                z.object({
                    source: z
                        .string()
                        .describe(
                            'Source name without "webhook-" prefix (e.g. "leadbyte", "slack-app")',
                        ),
                    stream: z
                        .string()
                        .describe(
                            'Stream name for this payload (e.g. "leads", "payments", "events")',
                        ),
                    payload: z
                        .record(z.unknown())
                        .describe('The raw webhook JSON body to introspect'),
                    key_properties: z
                        .array(z.string())
                        .optional()
                        .describe(
                            'Optional primary key field names (e.g. ["id", "lead_id"])',
                        ),
                }),
            ),
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.WEBHOOK_INTROSPECT],
        },
        async (rawArgs: Record<string, unknown>, extra) => {
            const {
                source,
                stream,
                payload,
                key_properties: keyProperties,
            } = rawArgs as {
                source: string;
                stream: string;
                payload: Record<string, unknown>;
                key_properties?: string[];
            };
            const pctx = extra as McpProtocolContext;
            ctx.trackToolCall(pctx, BratraxMcpToolName.WEBHOOK_INTROSPECT);
            ctx.canAccessMcp(pctx);

            try {
                const projectUuid = await ctx.resolveProjectUuid(pctx);
                const discoveryModel = getBratraxDiscoveryModel(ctx.services);
                const sourceKey = `webhook-${source}`;

                // Read existing catalog from DB (if any) for merge
                const existingRow = await discoveryModel.getCatalog(
                    projectUuid,
                    sourceKey,
                );
                const existingCatalog = existingRow
                    ? safeParseCatalogJson(existingRow.catalog_json)
                    : null;

                // Stateless merge via Python API
                const result = (await introspectWebhookPayload({
                    source,
                    stream,
                    payload,
                    key_properties: keyProperties,
                    existing_catalog: existingCatalog,
                })) as { catalog: object };

                // Upsert merged catalog into DB
                await discoveryModel.upsertProjectCatalog(
                    projectUuid,
                    sourceKey,
                    result.catalog,
                );

                const entry = parseSingerCatalog(sourceKey, result.catalog);
                const totalFields =
                    entry?.streams.reduce(
                        (sum, s) => sum + s.fields.length,
                        0,
                    ) ?? 0;

                return ctx.textResult(
                    JSON.stringify(
                        {
                            source,
                            stream,
                            source_key: sourceKey,
                            streams_count: entry?.streams.length ?? 0,
                            fields_count: totalFields,
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
                            text: `Error introspecting webhook payload: ${msg}`,
                        },
                    ],
                    isError: true,
                };
            }
        },
    );
}
