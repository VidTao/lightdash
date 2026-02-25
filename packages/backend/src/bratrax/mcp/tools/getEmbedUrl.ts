import { subject } from '@casl/ability';
import {
    AnyType,
    type CreateEmbedJwt,
    ForbiddenError,
    NotFoundError,
    ParameterError,
    toolGetEmbedUrlArgsSchema,
    type ToolGetEmbedUrlArgs,
} from '@lightdash/common';
import { fromSession } from '../../../auth/account';
import { BratraxEmbedService } from '../../services/BratraxEmbedService';
import type { McpToolContext } from '../toolContext';
import { TOOL_ANNOTATIONS } from '../toolAnnotations';
import { TOOL_TITLES } from '../toolTitles';
import { BratraxMcpToolName, type McpProtocolContext } from '../types';

async function generateEmbedUrl(
    ctx: McpToolContext,
    args: ToolGetEmbedUrlArgs,
    projectUuid: string,
    pctx: McpProtocolContext,
): Promise<string> {
    const { user, account } = pctx.authInfo!.extra;
    const { organizationUuid } = user;

    if (!user || !organizationUuid || !account) {
        throw new ForbiddenError('Authentication required');
    }

    const sessionAccount = fromSession(
        user,
        account.authentication.source,
    );

    const resourceType = args.resource_type || 'chart';
    const expiresIn = args.expires_in || '8h';
    const canExportCsv = args.can_export_csv || false;
    const canExportImages = args.can_export_images || false;
    const returnMarkdown = args.return_markdown !== false;
    const rawDirective = args.raw_directive || false;
    const defaultHeight = 600;
    const embedHeight = args.height || defaultHeight;

    try {
        let embedUrl: string;
        let title: string;

        if (resourceType === 'dashboard') {
            const embedService =
                ctx.services.getEmbedService<BratraxEmbedService>();

            const dashboardContent: CreateEmbedJwt['content'] = {
                type: 'dashboard' as const,
                dashboardUuid: args.resource_uuid,
                canExportCsv,
                canExportImages,
            };
            if (
                args.dashboard_filters_interactivity &&
                'enabled' in args.dashboard_filters_interactivity
            ) {
                (dashboardContent as AnyType).dashboardFiltersInteractivity =
                    args.dashboard_filters_interactivity;
            }

            const jwtData: CreateEmbedJwt = {
                content: dashboardContent,
                userAttributes: {
                    organizationUuid,
                },
            };

            const embedResult = await embedService.getEmbedUrl(
                projectUuid,
                jwtData,
                expiresIn,
                user.userUuid,
            );
            embedUrl = embedResult.url;

            title = `Dashboard ${args.resource_uuid}`;
            try {
                const dashboardService =
                    ctx.services.getDashboardService();
                const dashboard = await dashboardService.getByIdOrSlug(
                    user,
                    args.resource_uuid,
                );
                title = dashboard.name;
            } catch (error) {
                // Fall back to default title
            }
        } else if (resourceType === 'chart') {
            try {
                const chart = await ctx.savedChartModel.get(
                    args.resource_uuid,
                );

                const space = await ctx.spaceModel.getSpaceSummary(
                    chart.spaceUuid,
                );
                const access = await ctx.spaceModel.getUserSpaceAccess(
                    user.userUuid,
                    chart.spaceUuid,
                    { useInheritedAccess: true },
                );

                if (
                    user.ability.cannot(
                        'view',
                        subject('SavedChart', {
                            organizationUuid,
                            projectUuid: chart.projectUuid,
                            isPrivate: space.isPrivate,
                            access,
                        }),
                    )
                ) {
                    throw new ForbiddenError(
                        'You do not have access to this chart',
                    );
                }

                title = chart.name;

                const baseUrl = ctx.config.siteUrl;
                embedUrl = `${baseUrl}/projects/${projectUuid}/saved/${args.resource_uuid}`;
            } catch (error) {
                if (error instanceof ForbiddenError) {
                    throw error;
                }
                throw new NotFoundError(
                    `Chart with UUID ${args.resource_uuid} not found`,
                );
            }
        } else {
            throw new ParameterError(
                `Unsupported resource type: ${resourceType}. Supported types: 'chart', 'dashboard'`,
            );
        }

        if (rawDirective) {
            const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body, html {
            margin: 0;
            padding: 0;
            height: 100%;
            overflow: hidden;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
        }
    </style>
</head>
<body>
    <iframe
        src="${embedUrl}"
        title="${title}"
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals">
    </iframe>
</body>
</html>`;

            return `Please create an artifact with the following properties:

:::artifact identifier="lightdash-embed-${args.resource_uuid.substring(0, 8)}" type="text/html" title="${title}"
${htmlContent}
:::

This will embed the Lightdash ${resourceType} directly in the chat.

If the embed doesn't display due to security restrictions, you can open it directly at: ${embedUrl}`;
        }

        if (returnMarkdown) {
            const simpleTitle = `Dashboard ${args.resource_uuid}`;
            return `:::lightdash-${resourceType}{url="${embedUrl}" title="${simpleTitle}" height="${embedHeight}"}\n:::`;
        }

        return JSON.stringify(
            {
                url: embedUrl,
                title,
                resource_type: resourceType,
                resource_uuid: args.resource_uuid,
                height: embedHeight,
                expires_in:
                    resourceType === 'dashboard' ? expiresIn : null,
            },
            null,
            2,
        );
    } catch (error) {
        if (
            error instanceof ForbiddenError ||
            error instanceof NotFoundError ||
            error instanceof ParameterError
        ) {
            throw error;
        }

        let errorMsg =
            error instanceof Error ? error.message : String(error);

        if (
            errorMsg.includes('embedService') &&
            errorMsg.includes('no factory or provider')
        ) {
            errorMsg =
                'Dashboard embedding is not available in your Lightdash instance. This feature requires an enterprise license.';
        } else if (errorMsg.includes('422')) {
            errorMsg = `Invalid request: ${errorMsg}`;
        } else if (errorMsg.includes('404')) {
            errorMsg = `${resourceType === 'dashboard' ? 'Dashboard' : 'Chart'} not found. Please check the UUID.`;
        } else {
            errorMsg = `Failed to generate embed URL: ${errorMsg}`;
        }

        throw new ParameterError(errorMsg);
    }
}

export function registerGetEmbedUrlTool(ctx: McpToolContext): void {
    ctx.server.registerTool(
        BratraxMcpToolName.GET_EMBED_URL,
        {
            title: TOOL_TITLES[BratraxMcpToolName.GET_EMBED_URL],
            description: toolGetEmbedUrlArgsSchema.description,
            inputSchema: ctx.compatSchema(
                toolGetEmbedUrlArgsSchema,
            ) as AnyType,
            annotations: TOOL_ANNOTATIONS[BratraxMcpToolName.GET_EMBED_URL],
        },
        async (_args: AnyType, extra: AnyType) => {
            const pctx = extra as McpProtocolContext;
            const args = _args as ToolGetEmbedUrlArgs;
            const projectUuid = await ctx.resolveProjectUuid(pctx);
            ctx.trackToolCall(
                pctx,
                BratraxMcpToolName.GET_EMBED_URL,
                projectUuid,
            );

            const result = await generateEmbedUrl(
                ctx,
                args,
                projectUuid,
                pctx,
            );

            return ctx.textResult(result);
        },
    );
}
