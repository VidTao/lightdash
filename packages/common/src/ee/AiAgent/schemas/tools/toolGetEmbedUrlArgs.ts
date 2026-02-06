import { z } from 'zod';
import { createToolSchema } from '../toolSchemaBuilder';

export const TOOL_GET_EMBED_URL_DESCRIPTION = `Tool: "getEmbedUrl"
Purpose:
Generate an embed URL for a Lightdash chart or dashboard that can be displayed in an iframe.

Usage tips:
- Provide the UUID of the chart or dashboard you want to embed
- Specify whether it's a 'chart' or 'dashboard' (defaults to 'chart')
- Configure embedding options like export permissions and display settings
- Returns HTML iframe code or direct URL based on your preferences
- Dashboard embedding uses JWT tokens, chart embedding uses direct URLs
`;

export const toolGetEmbedUrlArgsSchema = createToolSchema(
   { 
    description: TOOL_GET_EMBED_URL_DESCRIPTION,
   }
)
    .extend({
        resource_uuid: z
            .string()
            .describe('The UUID of the chart or dashboard to embed'),
        resource_type: z
            .enum(['chart', 'dashboard'])
            .optional()
            .default('chart')
            .describe('Whether this is a chart or dashboard'),
        expires_in: z
            .string()
            .optional()
            .default('8h')
            .describe('JWT expiration time (e.g., "1h", "8h", "24h", "7d")'),
        dashboard_filters_interactivity: z
            .object({})
            .optional()
            .describe('Optional dashboard filter settings for interactivity'),
        can_export_csv: z
            .boolean()
            .optional()
            .default(false)
            .describe('Allow CSV export from embedded view'),
        can_export_images: z
            .boolean()
            .optional()
            .default(false)
            .describe('Allow image export from embedded view'),
        return_markdown: z
            .boolean()
            .optional()
            .default(true)
            .describe('Return markdown directive for LibreChat rendering'),
        raw_directive: z
            .boolean()
            .optional()
            .default(false)
            .describe('Return only the raw directive without any wrapper text'),
        height: z
            .number()
            .optional()
            .default(600)
            .describe('Height of the embed in pixels'),
    })
    .build();

export type ToolGetEmbedUrlArgs = z.infer<typeof toolGetEmbedUrlArgsSchema>;

export const toolGetEmbedUrlArgsSchemaTransformed = toolGetEmbedUrlArgsSchema;

export type ToolGetEmbedUrlArgsTransformed = ToolGetEmbedUrlArgs;
