/* eslint-disable import/extensions */
import { subject } from '@casl/ability';
import {
    Account,
    AnyType,
    CartesianSeriesType,
    ChartType,
    CommercialFeatureFlags,
    convertAiTableCalcsSchemaToTableCalcs,
    CreateSavedChart,
    Explore,
    filterExploreByTags,
    ForbiddenError,
    getValidAiQueryLimit,
    isExploreError,
    MissingConfigError,
    SessionUser,
    ToolRunQueryArgsTransformed,
    UserAttributeValueMap,
} from '@lightdash/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import * as Sentry from '@sentry/node';
import { z, ZodRawShape } from 'zod';
import {
    LightdashAnalytics,
    McpToolCallEvent,
} from '../../analytics/LightdashAnalytics';
import { LightdashConfig } from '../../config/parseConfig';
import { McpContextModel } from '../../models/McpContextModel';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SavedChartModel } from '../../models/SavedChartModel';
import { SearchModel } from '../../models/SearchModel';
import { SpaceModel } from '../../models/SpaceModel';
import { UserAttributesModel } from '../../models/UserAttributesModel';
import { AsyncQueryService } from '../../services/AsyncQueryService/AsyncQueryService';
import { BaseService } from '../../services/BaseService';
import { CatalogService } from '../../services/CatalogService/CatalogService';
import { FeatureFlagService } from '../../services/FeatureFlag/FeatureFlagService';
import { ProjectService } from '../../services/ProjectService/ProjectService';
import { ServiceRepository } from '../../services/ServiceRepository';
import { SpaceService } from '../../services/SpaceService/SpaceService';
import {
    doesExploreMatchRequiredAttributes,
    getFilteredExplore,
    mergeUserAttributes,
    validateUserAttributeOverrides,
} from '../../services/UserAttributesService/UserAttributeUtils';
import { wrapSentryTransaction } from '../../utils';
import { VERSION } from '../../version';
import { McpSchemaCompatLayer } from './mcpSchemaCompat';
import { registerAllPrompts } from './prompts/workshops';
import { registerAllTools } from './tools';
import type { McpToolContext } from './toolContext';
import {
    BratraxMcpToolName,
    type McpProtocolContext,
} from './types';
import { populateCustomMetricsSQL } from './utils/customMetrics';

type BratraxMcpServiceArgs = {
    lightdashConfig: LightdashConfig;
    analytics: LightdashAnalytics;
    asyncQueryService: AsyncQueryService;
    catalogService: CatalogService;
    projectModel: ProjectModel;
    projectService: ProjectService;
    userAttributesModel: UserAttributesModel;
    searchModel: SearchModel;
    spaceService: SpaceService;
    mcpContextModel: McpContextModel;
    featureFlagService: FeatureFlagService;
    services: ServiceRepository;
    savedChartModel: SavedChartModel;
    spaceModel: SpaceModel;
};

export class BratraxMcpService extends BaseService {
    public lightdashConfig: LightdashConfig;

    private analytics: LightdashAnalytics;

    private asyncQueryService: AsyncQueryService;

    private catalogService: CatalogService;

    private projectService: ProjectService;

    private projectModel: ProjectModel;

    private userAttributesModel: UserAttributesModel;

    private searchModel: SearchModel;

    private spaceService: SpaceService;

    private mcpContextModel: McpContextModel;

    private featureFlagService: FeatureFlagService;

    private services: ServiceRepository;

    private savedChartModel: SavedChartModel;

    private spaceModel: SpaceModel;

    private mcpServer: McpServer;

    private mcpCompatLayer: McpSchemaCompatLayer;

    constructor({
        lightdashConfig,
        analytics,
        asyncQueryService,
        catalogService,
        projectService,
        userAttributesModel,
        searchModel,
        spaceService,
        projectModel,
        mcpContextModel,
        featureFlagService,
        services,
        savedChartModel,
        spaceModel,
    }: BratraxMcpServiceArgs) {
        super();
        this.lightdashConfig = lightdashConfig;
        this.analytics = analytics;
        this.asyncQueryService = asyncQueryService;
        this.catalogService = catalogService;
        this.projectService = projectService;
        this.userAttributesModel = userAttributesModel;
        this.searchModel = searchModel;
        this.projectModel = projectModel;
        this.spaceService = spaceService;
        this.mcpContextModel = mcpContextModel;
        this.featureFlagService = featureFlagService;
        this.services = services;
        this.savedChartModel = savedChartModel;
        this.spaceModel = spaceModel;
        this.mcpCompatLayer = new McpSchemaCompatLayer();

        this.mcpServer = this.createMcpServerInstance();
        this.registerTools();
    }

    // ── public interface (consumed by mcpRouter) ───────────────────────

    /**
     * Creates a fresh McpServer for each HTTP request.
     *
     * Streamable HTTP in stateless mode (sessionIdGenerator: undefined)
     * requires a new server+transport per request because the MCP SDK's
     * Protocol class throws "Already connected" if you call connect()
     * twice on the same instance.
     *
     * registerTools() is synchronous (just sets up callbacks), so the
     * temporary swap of this.mcpServer is safe in Node's single-threaded
     * event loop — no interleaving can occur.
     */
    public createRequestServer(): McpServer {
        const server = this.createMcpServerInstance();
        const savedServer = this.mcpServer;
        this.mcpServer = server;
        this.registerTools();
        this.mcpServer = savedServer;
        return server;
    }

    /** @deprecated Use createRequestServer() for stateless HTTP */
    public getServer(): McpServer {
        return this.mcpServer;
    }

    // eslint-disable-next-line class-methods-use-this
    public getAccount(context: McpProtocolContext): {
        user: SessionUser;
        organizationUuid: string;
        account: Account;
    } {
        const { user, account } = context.authInfo!.extra;
        if (!user || !user.organizationUuid || !account) {
            throw new ForbiddenError();
        }
        return { user, organizationUuid: user.organizationUuid, account };
    }

    public canAccessMcp(context: McpProtocolContext): boolean {
        if (!context.authInfo) {
            throw new ForbiddenError('Invalid authInfo context');
        }
        if (!this.lightdashConfig.mcp.enabled) {
            throw new MissingConfigError('MCP is not enabled');
        }
        return true;
    }

    public async isEnabled(
        user: Pick<SessionUser, 'userUuid' | 'organizationUuid'>,
    ): Promise<boolean> {
        if (this.lightdashConfig.mcp.enabled) return true;
        const flag = await this.featureFlagService.get({
            user,
            featureFlagId: CommercialFeatureFlags.AiCopilot,
        });
        return flag.enabled;
    }

    // ── private helpers ────────────────────────────────────────────────

    private createMcpServerInstance(): McpServer {
        return Sentry.wrapMcpServerWithSentry(
            new McpServer({
                name: 'Bratrax MCP Server',
                version: VERSION,
                websiteUrl: this.lightdashConfig.siteUrl,
                icons: [
                    {
                        src: `${this.lightdashConfig.siteUrl}/logo-icon.svg`,
                        mimeType: 'image/svg+xml',
                    },
                    {
                        src: `${this.lightdashConfig.siteUrl}/favicon-32x32.png`,
                        mimeType: 'image/png',
                        sizes: ['32x32'],
                    },
                    {
                        src: `${this.lightdashConfig.siteUrl}/apple-touch-icon.png`,
                        mimeType: 'image/png',
                        sizes: ['152x152'],
                    },
                ],
            }),
        );
    }

    private compatSchema(schema: z.ZodSchema<unknown>): ZodRawShape {
        return this.mcpCompatLayer.processZodType(schema).shape;
    }

    private requireOrgUuid(user: SessionUser): string {
        const { organizationUuid } = user;
        if (!organizationUuid) {
            throw new ForbiddenError('Organization not found');
        }
        return organizationUuid;
    }

    private async resolveProjectUuid(ctx: McpProtocolContext): Promise<string> {
        const { user } = ctx.authInfo!.extra;
        const orgUuid = this.requireOrgUuid(user);
        const row = await this.mcpContextModel.getContext(
            user.userUuid,
            orgUuid,
        );
        const uuid = row?.context.projectUuid;
        if (uuid) {
            return uuid;
        }

        // Auto-set project when user has exactly one
        const projects =
            await this.projectModel.getAllByOrganizationUuid(orgUuid);
        if (projects.length === 1) {
            const project = projects[0];
            await this.mcpContextModel.setContext({
                userUuid: user.userUuid,
                organizationUuid: orgUuid,
                context: {
                    projectUuid: project.projectUuid,
                    projectName: project.name,
                    tags: null,
                },
            });
            return project.projectUuid;
        }

        const projectList = projects
            .map((p) => `  - ${p.name}: ${p.projectUuid}`)
            .join('\n');
        throw new ForbiddenError(
            `No project context set. Use set_project with one of:\n${projectList}`,
        );
    }

    private async getTagsFromContext(
        ctx: McpProtocolContext,
    ): Promise<string[] | null> {
        const { user } = ctx.authInfo!.extra;
        const orgUuid = this.requireOrgUuid(user);
        const row = await this.mcpContextModel.getContext(
            user.userUuid,
            orgUuid,
        );
        return row?.context.tags || null;
    }

    private async getMergedUserAttributes(
        ctx: McpProtocolContext,
    ): Promise<UserAttributeValueMap> {
        const { user, headerUserAttributes } = ctx.authInfo!.extra;
        const orgUuid = this.requireOrgUuid(user);
        const dbAttrs =
            await this.userAttributesModel.getAttributeValuesForOrgMember({
                organizationUuid: orgUuid,
                userUuid: user.userUuid,
            });
        if (headerUserAttributes) {
            validateUserAttributeOverrides(
                user,
                headerUserAttributes,
                dbAttrs,
            );
        }
        return mergeUserAttributes(dbAttrs, headerUserAttributes);
    }

    private async getUserAttributeOverrides(
        ctx: McpProtocolContext,
    ): Promise<UserAttributeValueMap | undefined> {
        const { user, headerUserAttributes } = ctx.authInfo!.extra;
        if (!headerUserAttributes) return undefined;
        const orgUuid = this.requireOrgUuid(user);
        const dbAttrs =
            await this.userAttributesModel.getAttributeValuesForOrgMember({
                organizationUuid: orgUuid,
                userUuid: user.userUuid,
            });
        validateUserAttributeOverrides(user, headerUserAttributes, dbAttrs);
        return headerUserAttributes;
    }

    private async getAvailableExplores(
        user: SessionUser,
        projectUuid: string,
        tags: string[] | null,
        attrOverrides?: UserAttributeValueMap,
    ): Promise<Explore[]> {
        return wrapSentryTransaction(
            'BratraxMcp.getAvailableExplores',
            { projectUuid, tags },
            async () => {
                const orgUuid = this.requireOrgUuid(user);
                const dbAttrs =
                    await this.userAttributesModel.getAttributeValuesForOrgMember(
                        {
                            organizationUuid: orgUuid,
                            userUuid: user.userUuid,
                        },
                    );
                const userAttrs = mergeUserAttributes(dbAttrs, attrOverrides);

                const allExplores = Object.values(
                    await this.projectModel.findExploresFromCache(
                        projectUuid,
                        'name',
                    ),
                );

                return allExplores
                    .filter(
                        (e): e is Explore => !isExploreError(e),
                    )
                    .filter((e) =>
                        doesExploreMatchRequiredAttributes(
                            e.tables[e.baseTable].requiredAttributes,
                            userAttrs,
                        ),
                    )
                    .map((e) => getFilteredExplore(e, userAttrs))
                    .filter((e) =>
                        filterExploreByTags({ explore: e, availableTags: tags }),
                    )
                    .filter((e): e is Explore => !!e);
            },
        );
    }

    private async requireProjectAccess(
        ctx: McpProtocolContext,
        projectUuid: string,
    ): Promise<void> {
        const { user, account } = ctx.authInfo!.extra;
        const project = await this.projectService.getProject(
            projectUuid,
            account,
        );
        if (
            user.ability.cannot(
                'view',
                subject('Project', {
                    projectUuid,
                    organizationUuid: project.organizationUuid,
                }),
            )
        ) {
            throw new ForbiddenError();
        }
    }

    private trackToolCall(
        ctx: McpProtocolContext,
        toolName: string,
        projectUuid?: string,
    ): void {
        try {
            const { user, organizationUuid } = this.getAccount(ctx);
            this.analytics.track<McpToolCallEvent>({
                event: 'mcp_tool_call',
                userId: user.userUuid,
                properties: {
                    organizationId: organizationUuid,
                    projectId: projectUuid,
                    toolName,
                },
            });
        } catch {
            this.logger.debug('Failed to track MCP tool call');
        }
    }

    private static readonly MAX_RESULT_SIZE = 1024 * 1024; // 1MB

    // eslint-disable-next-line class-methods-use-this
    private textResult(text: string) {
        if (text.length > BratraxMcpService.MAX_RESULT_SIZE) {
            const sizeMb = (text.length / 1024 / 1024).toFixed(1);
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Result truncated (${sizeMb}MB exceeds 1MB limit). Use more specific filters to reduce result size.`,
                    },
                ],
                isError: true,
            };
        }
        return { content: [{ type: 'text' as const, text }] };
    }

    private buildMetricQueryFromViz(
        viz: ToolRunQueryArgsTransformed,
        explore: Explore,
    ) {
        const maxLimit = this.lightdashConfig.ai.copilot.maxQueryLimit;
        return {
            exploreName: viz.queryConfig.exploreName,
            dimensions: viz.queryConfig.dimensions,
            metrics: viz.queryConfig.metrics,
            sorts: viz.queryConfig.sorts.map((s) => ({
                ...s,
                nullsFirst: s.nullsFirst ?? undefined,
            })),
            limit: getValidAiQueryLimit(viz.queryConfig.limit, maxLimit),
            filters: viz.filters,
            additionalMetrics: populateCustomMetricsSQL(
                viz.customMetrics,
                explore,
            ),
            tableCalculations: convertAiTableCalcsSchemaToTableCalcs(
                viz.tableCalculations,
            ),
        };
    }

    // eslint-disable-next-line class-methods-use-this
    private mapChartType(
        defaultVizType: string | null | undefined,
    ): ChartType {
        switch (defaultVizType) {
            case 'table':
                return ChartType.TABLE;
            case 'pie':
                return ChartType.PIE;
            case 'funnel':
                return ChartType.FUNNEL;
            case 'bar':
            case 'horizontal':
            case 'line':
            case 'scatter':
            default:
                return ChartType.CARTESIAN;
        }
    }

    // eslint-disable-next-line class-methods-use-this
    private buildChartConfig(
        chartType: ChartType,
        defaultVizType: string | null | undefined,
        dimensions: string[],
        metrics: string[],
    ): CreateSavedChart['chartConfig'] {
        if (chartType !== ChartType.CARTESIAN) {
            return { type: chartType, config: undefined };
        }

        const xField = dimensions[0];
        const yField = metrics;
        const flipAxes = defaultVizType === 'horizontal';

        const seriesType: CartesianSeriesType =
            defaultVizType === 'line'
                ? CartesianSeriesType.LINE
                : defaultVizType === 'scatter'
                  ? CartesianSeriesType.SCATTER
                  : CartesianSeriesType.BAR;

        const series = metrics.map((metric) => ({
            type: seriesType,
            encode: {
                xRef: { field: xField },
                yRef: { field: metric },
            },
            yAxisIndex: 0,
        }));

        return {
            type: ChartType.CARTESIAN,
            config: {
                layout: {
                    xField,
                    yField,
                    flipAxes: flipAxes || undefined,
                },
                eChartsConfig: {
                    series,
                },
            },
        };
    }

    // ── tool registration ──────────────────────────────────────────────

    /**
     * Builds a McpToolContext from this service's private state and
     * delegates to registerAllTools() which calls each tool file.
     */
    private registerTools(): void {
        const ctx: McpToolContext = {
            server: this.mcpServer,
            config: this.lightdashConfig,
            analytics: this.analytics,
            asyncQueryService: this.asyncQueryService,
            catalogService: this.catalogService,
            projectService: this.projectService,
            projectModel: this.projectModel,
            userAttributesModel: this.userAttributesModel,
            searchModel: this.searchModel,
            spaceService: this.spaceService,
            spaceModel: this.spaceModel,
            mcpContextModel: this.mcpContextModel,
            featureFlagService: this.featureFlagService,
            services: this.services,
            savedChartModel: this.savedChartModel,
            compatSchema: this.compatSchema.bind(this),
            getAccount: this.getAccount.bind(this),
            canAccessMcp: this.canAccessMcp.bind(this),
            resolveProjectUuid: this.resolveProjectUuid.bind(this),
            getTagsFromContext: this.getTagsFromContext.bind(this),
            getMergedUserAttributes: this.getMergedUserAttributes.bind(this),
            getUserAttributeOverrides: this.getUserAttributeOverrides.bind(this),
            getAvailableExplores: this.getAvailableExplores.bind(this),
            requireProjectAccess: this.requireProjectAccess.bind(this),
            trackToolCall: this.trackToolCall.bind(this),
            textResult: this.textResult.bind(this),
            buildMetricQueryFromViz: this.buildMetricQueryFromViz.bind(this),
            mapChartType: this.mapChartType.bind(this),
            buildChartConfig: this.buildChartConfig.bind(this),
        };
        registerAllTools(ctx);
        registerAllPrompts(this.mcpServer);
    }
}
