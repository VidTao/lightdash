/* eslint-disable import/extensions */
import { subject } from '@casl/ability';
import {
    Account,
    AiResultType,
    AnyType,
    CatalogType,
    ChartType,
    CommercialFeatureFlags,
    convertAiTableCalcsSchemaToTableCalcs,
    CreateDashboardWithCharts,
    CreateEmbedJwt,
    CreateSavedChart,
    Explore,
    filterExploreByTags,
    ForbiddenError,
    getItemLabelWithoutTableName,
    getSlackAiEchartsConfig,
    getValidAiQueryLimit,
    isExploreError,
    mcpToolListExploresArgsSchema,
    MissingConfigError,
    NotFoundError,
    ParameterError,
    QueryExecutionContext,
    SessionUser,
    toolDashboardV2ArgsSchema,
    toolDashboardV2ArgsSchemaTransformed,
    ToolDashboardV2ArgsTransformed,
    ToolFindContentArgs,
    toolFindContentArgsSchema,
    toolFindExploresArgsSchemaV3,
    ToolFindExploresArgsV3,
    ToolFindFieldsArgs,
    toolFindFieldsArgsSchema,
    toolRunQueryArgsSchema,
    toolRunQueryArgsSchemaTransformed,
    ToolRunQueryArgsTransformed,
    ToolGetEmbedUrlArgs,
    toolGetEmbedUrlArgsSchema,
    ToolSearchFieldValuesArgs,
    toolSearchFieldValuesArgsSchema,
    UserAttributeValueMap,
} from '@lightdash/common';
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import {
    ServerNotification,
    ServerRequest,
} from '@modelcontextprotocol/sdk/types.js';
import * as Sentry from '@sentry/node';
import { stringify } from 'csv-stringify/sync';
import fs from 'fs/promises';
import path from 'path';
import { z, ZodRawShape } from 'zod';
import {
    LightdashAnalytics,
    McpToolCallEvent,
} from '../../analytics/LightdashAnalytics';
import { LightdashConfig } from '../../config/parseConfig';
import { CatalogSearchContext } from '../../models/CatalogModel/CatalogModel';
import { McpContextModel } from '../../models/McpContextModel';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SearchModel } from '../../models/SearchModel';
import { UserAttributesModel } from '../../models/UserAttributesModel';
import { AsyncQueryService } from '../../services/AsyncQueryService/AsyncQueryService';
import { BaseService } from '../../services/BaseService';
import { CatalogService } from '../../services/CatalogService/CatalogService';
import { CsvService } from '../../services/CsvService/CsvService';
import { FeatureFlagService } from '../../services/FeatureFlag/FeatureFlagService';
import { ProjectService } from '../../services/ProjectService/ProjectService';
import { SpaceService } from '../../services/SpaceService/SpaceService';
import {
    doesExploreMatchRequiredAttributes,
    getFilteredExplore,
    mergeUserAttributes,
    validateUserAttributeOverrides,
} from '../../services/UserAttributesService/UserAttributeUtils';
import { fromSession } from '../../auth/account';
import { wrapSentryTransaction } from '../../utils';
import { VERSION } from '../../version';
import { ServiceRepository } from '../../services/ServiceRepository';
import { SavedChartModel } from '../../models/SavedChartModel';
import { SpaceModel } from '../../models/SpaceModel';
import {
    registerAppResource,
    registerAppTool,
    RESOURCE_MIME_TYPE,
} from './mcpAppHelpers';
import { McpSchemaCompatLayer } from './mcpSchemaCompat';
import {
    BratraxMcpToolName,
    type ExtraContext,
    type McpProtocolContext,
} from './types';
import { BratraxEmbedService } from '../services/BratraxEmbedService';
import { ExploreContext } from './utils/exploreContext';
import { populateCustomMetricsSQL } from './utils/customMetrics';
import { serializeData } from './utils/serializeData';
import { pivotResults } from './utils/pivotResults';

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

const NO_RESULTS_MESSAGE =
    'The query returned 0 results. Please review the filters and try different criteria. Consider broadening the date range, removing restrictive filters, or verifying field values with the search_field_values tool.';

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

        this.mcpServer = Sentry.wrapMcpServerWithSentry(
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
        const server = Sentry.wrapMcpServerWithSentry(
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
        if (!uuid) {
            throw new ForbiddenError(
                'No project context set. Use set_project or provide projectUuid parameter.',
            );
        }
        return uuid;
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
                        (e): e is Explore =>
                            !isExploreError(e),
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

    private textResult(text: string) {
        return { content: [{ type: 'text' as const, text }] };
    }

    /**
     * Build a MetricQuery object from a transformed visualization config.
     * Shared by run_metric_query and generate_dashboard tools.
     */
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

    /**
     * Map the AI schema's defaultVizType string to Lightdash's ChartType enum.
     */
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

    // ── tool registration ──────────────────────────────────────────────

    private registerTools(): void {
        this.registerGetVersion();
        this.registerListExplores();
        this.registerFindExplores();
        this.registerFindFields();
        this.registerFindContent();
        this.registerListProjects();
        this.registerSetProject();
        this.registerGetCurrentProject();
        this.registerRunMetricQuery();
        this.registerSearchFieldValues();
        this.registerGetEmbedUrl();
        this.registerGenerateDashboard();
    }

    private registerGetVersion(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.GET_LIGHTDASH_VERSION,
            { description: 'Get the current Lightdash version', inputSchema: {} },
            async (_args: Record<string, never>, extra) => {
                const ctx = extra as McpProtocolContext;
                this.trackToolCall(ctx, BratraxMcpToolName.GET_LIGHTDASH_VERSION);
                this.canAccessMcp(ctx);
                return this.textResult(VERSION);
            },
        );
    }

    private registerListExplores(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.LIST_EXPLORES,
            {
                description: mcpToolListExploresArgsSchema.description,
                inputSchema: this.compatSchema(mcpToolListExploresArgsSchema),
            },
            async (_args: AnyType, extra) => {
                const ctx = extra as McpProtocolContext;
                const { user } = this.getAccount(ctx);
                const projectUuid = await this.resolveProjectUuid(ctx);
                this.trackToolCall(ctx, BratraxMcpToolName.LIST_EXPLORES, projectUuid);

                const tags = await this.getTagsFromContext(ctx);
                const attrOverrides = await this.getUserAttributeOverrides(ctx);
                const explores = await this.getAvailableExplores(
                    user, projectUuid, tags, attrOverrides,
                );

                const summary = explores.map((e) => ({
                    name: e.name,
                    label: e.label,
                    description: e.tables[e.baseTable]?.description,
                    tags: e.tags,
                }));

                return this.textResult(JSON.stringify(summary, null, 2));
            },
        );
    }

    private registerFindExplores(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.FIND_EXPLORES,
            {
                description: toolFindExploresArgsSchemaV3.description,
                inputSchema: this.compatSchema(toolFindExploresArgsSchemaV3),
            },
            async (_args: AnyType, extra) => {
                const ctx = extra as McpProtocolContext;
                const args = _args as Omit<ToolFindExploresArgsV3, 'type'>;
                const projectUuid = await this.resolveProjectUuid(ctx);
                this.trackToolCall(ctx, BratraxMcpToolName.FIND_EXPLORES, projectUuid);

                await this.requireProjectAccess(ctx, projectUuid);
                const tags = await this.getTagsFromContext(ctx);
                const userAttrs = await this.getMergedUserAttributes(ctx);

                // Search tables
                const tableResults = await this.catalogService.searchCatalog({
                    projectUuid,
                    userAttributes: userAttrs,
                    catalogSearch: {
                        searchQuery: args.searchQuery,
                        type: CatalogType.Table,
                        catalogTags: tags || undefined,
                    },
                    context: CatalogSearchContext.MCP,
                    paginateArgs: { page: 1, pageSize: 15 },
                    fullTextSearchOperator: 'OR',
                });

                const exploreResults = tableResults.data
                    .filter((item) => item.type === CatalogType.Table)
                    .map((t) => ({
                        name: t.name,
                        label: t.label,
                        description: t.description,
                        aiHints: t.aiHints ?? undefined,
                        searchRank: t.searchRank,
                        joinedTables: t.joinedTables ?? undefined,
                    }));

                // Also search fields to suggest relevant tables
                const fieldResults = await this.catalogService.searchCatalog({
                    projectUuid,
                    userAttributes: userAttrs,
                    catalogSearch: {
                        searchQuery: args.searchQuery,
                        type: CatalogType.Field,
                        catalogTags: tags || undefined,
                    },
                    context: CatalogSearchContext.MCP,
                    paginateArgs: { page: 1, pageSize: 50 },
                    fullTextSearchOperator: 'OR',
                });

                const topFields = fieldResults.data
                    .filter((item) => item.type === CatalogType.Field)
                    .map((f) => ({
                        name: f.name,
                        label: f.label,
                        tableName: f.tableName,
                        fieldType: f.fieldType,
                        searchRank: f.searchRank,
                        description: f.description,
                    }));

                const output = {
                    exploreSearchResults: exploreResults,
                    topMatchingFields: topFields,
                };

                return this.textResult(JSON.stringify(output, null, 2));
            },
        );
    }

    private registerFindFields(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.FIND_FIELDS,
            {
                description: toolFindFieldsArgsSchema.description,
                inputSchema: this.compatSchema(toolFindFieldsArgsSchema),
            },
            async (_args: AnyType, extra) => {
                const ctx = extra as McpProtocolContext;
                const args = _args as Omit<ToolFindFieldsArgs, 'type'>;
                const projectUuid = await this.resolveProjectUuid(ctx);
                this.trackToolCall(ctx, BratraxMcpToolName.FIND_FIELDS, projectUuid);

                await this.requireProjectAccess(ctx, projectUuid);
                const tags = await this.getTagsFromContext(ctx);
                const userAttrs = await this.getMergedUserAttributes(ctx);
                const attrOverrides = await this.getUserAttributeOverrides(ctx);

                // Fetch the specific explore to scope catalog search
                const explores = await this.getAvailableExplores(
                    ctx.authInfo!.extra.user,
                    projectUuid,
                    tags,
                    attrOverrides,
                );
                const explore = explores.find((e) => e.name === args.table);
                if (!explore) {
                    throw new NotFoundError(`Explore '${args.table}' not found`);
                }

                // Use the first search query from the array
                const searchLabel =
                    args.fieldSearchQueries?.[0]?.label ?? '';
                const pageSize = 15;

                const { data: catalogItems, pagination } =
                    await this.catalogService.searchCatalog({
                        projectUuid,
                        catalogSearch: {
                            type: CatalogType.Field,
                            searchQuery: searchLabel,
                        },
                        context: CatalogSearchContext.MCP,
                        paginateArgs: {
                            page: args.page ?? 1,
                            pageSize,
                        },
                        userAttributes: userAttrs,
                        fullTextSearchOperator: 'OR',
                        filteredExplores: [explore],
                    });

                const fields = catalogItems.filter(
                    (item) => item.type === CatalogType.Field,
                );

                return this.textResult(
                    JSON.stringify({ fields, pagination }, null, 2),
                );
            },
        );
    }

    private registerFindContent(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.FIND_CONTENT,
            {
                description: toolFindContentArgsSchema.description,
                inputSchema: this.compatSchema(toolFindContentArgsSchema),
            },
            async (_args: AnyType, extra) => {
                const ctx = extra as McpProtocolContext;
                const args = _args as Omit<ToolFindContentArgs, 'type'>;
                const projectUuid = await this.resolveProjectUuid(ctx);
                this.trackToolCall(ctx, BratraxMcpToolName.FIND_CONTENT, projectUuid);

                await this.requireProjectAccess(ctx, projectUuid);
                const { user } = ctx.authInfo!.extra;

                // Use the first search query from the array
                const searchLabel =
                    args.searchQueries?.[0]?.label ?? '';

                const dashboards = await this.searchModel.searchDashboards(
                    projectUuid,
                    searchLabel,
                    undefined,
                    'OR',
                );
                const charts = await this.searchModel.searchAllCharts(
                    projectUuid,
                    searchLabel,
                    'OR',
                );

                const allContent = [...dashboards, ...charts];
                const filtered = await this.spaceService.filterBySpaceAccess(
                    user,
                    allContent,
                );

                const enriched = filtered.map((item) => ({
                    ...item,
                    url: 'uuid' in item
                        ? `${this.lightdashConfig.siteUrl}/projects/${projectUuid}/${'dashboardUuid' in item ? 'dashboards' : 'saved'}/${(item as { uuid: string }).uuid}`
                        : undefined,
                }));

                return this.textResult(JSON.stringify({ content: enriched }, null, 2));
            },
        );
    }

    private registerListProjects(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.LIST_PROJECTS,
            {
                description: 'List all accessible projects in the organization',
                inputSchema: {},
            },
            async (_args: Record<string, never>, extra) => {
                const ctx = extra as McpProtocolContext;
                const { organizationUuid } = this.getAccount(ctx);
                this.trackToolCall(ctx, BratraxMcpToolName.LIST_PROJECTS);

                const projects = await wrapSentryTransaction(
                    'BratraxMcp.listProjects',
                    { organizationUuid },
                    async () =>
                        this.projectModel.getAllByOrganizationUuid(
                            organizationUuid,
                        ),
                );

                const list = projects.map((p) => ({
                    name: p.name,
                    projectUuid: p.projectUuid,
                }));

                return this.textResult(JSON.stringify(list, null, 2));
            },
        );
    }

    private registerSetProject(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.SET_PROJECT,
            {
                description:
                    'Set the active project for subsequent MCP operations',
                inputSchema: {
                    projectUuid: z.string(),
                    tags: z.array(z.string()).optional(),
                },
            },
            async (_args: AnyType, extra) => {
                const ctx = extra as McpProtocolContext;
                const args = _args as { projectUuid: string; tags?: string[] };
                const { user, organizationUuid, account } = this.getAccount(ctx);
                this.trackToolCall(ctx, BratraxMcpToolName.SET_PROJECT, args.projectUuid);

                if (!args.projectUuid) {
                    throw new ParameterError('Project UUID is required');
                }

                const project = await this.projectService.getProject(
                    args.projectUuid,
                    account,
                );

                if (
                    user.ability.cannot(
                        'view',
                        subject('Project', {
                            projectUuid: args.projectUuid,
                            organizationUuid: project.organizationUuid,
                        }),
                    )
                ) {
                    throw new ForbiddenError(
                        'You do not have access to this project',
                    );
                }

                const tagsToSet =
                    args.tags !== undefined && args.tags.length > 0
                        ? args.tags
                        : null;

                await this.mcpContextModel.setContext({
                    userUuid: user.userUuid,
                    organizationUuid,
                    context: {
                        projectUuid: args.projectUuid,
                        projectName: project.name,
                        tags: tagsToSet,
                    },
                });

                return this.textResult(
                    JSON.stringify(
                        {
                            projectUuid: args.projectUuid,
                            projectName: project.name,
                            selectedTags: tagsToSet,
                        },
                        null,
                        2,
                    ),
                );
            },
        );
    }

    private registerGetCurrentProject(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.GET_CURRENT_PROJECT,
            { description: 'Get the currently active project', inputSchema: {} },
            async (_args: Record<string, never>, extra) => {
                const ctx = extra as McpProtocolContext;
                const { user, organizationUuid } = this.getAccount(ctx);
                this.trackToolCall(ctx, BratraxMcpToolName.GET_CURRENT_PROJECT);

                const row = await this.mcpContextModel.getContext(
                    user.userUuid,
                    organizationUuid,
                );

                if (!row || !row.context.projectUuid) {
                    return this.textResult(
                        JSON.stringify(
                            {
                                error: 'No active project set. Use set_project to set one.',
                            },
                            null,
                            2,
                        ),
                    );
                }

                return this.textResult(
                    JSON.stringify(
                        {
                            projectUuid: row.context.projectUuid,
                            projectName: row.context.projectName,
                            selectedTags: row.context.tags,
                        },
                        null,
                        2,
                    ),
                );
            },
        );
    }

    private registerRunMetricQuery(): void {
        // Register chart app resource for MCP App UI
        const chartResourceUri = 'ui://run-metric-query/chart.html';
        registerAppResource(
            this.mcpServer,
            chartResourceUri,
            chartResourceUri,
            { mimeType: RESOURCE_MIME_TYPE },
            async () => {
                const htmlPath = path.join(
                    __dirname,
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
            this.mcpServer,
            BratraxMcpToolName.RUN_METRIC_QUERY,
            {
                description: toolRunQueryArgsSchema.description,
                inputSchema: this.compatSchema(toolRunQueryArgsSchema),
                _meta: { ui: { resourceUri: chartResourceUri } },
            },
            async (_args: AnyType, extra: RequestHandlerExtra<ServerRequest, ServerNotification>) => {
                const ctx = extra as McpProtocolContext;
                const projectUuid = await this.resolveProjectUuid(ctx);
                this.trackToolCall(ctx, BratraxMcpToolName.RUN_METRIC_QUERY, projectUuid);

                try {
                    const { user, account } = ctx.authInfo!.extra;
                    await this.requireProjectAccess(ctx, projectUuid);

                    const tags = await this.getTagsFromContext(ctx);
                    const attrOverrides = await this.getUserAttributeOverrides(ctx);
                    const explores = await this.getAvailableExplores(
                        user, projectUuid, tags, attrOverrides,
                    );
                    const exploreCtx = new ExploreContext(explores);

                    const queryTool = toolRunQueryArgsSchemaTransformed.parse({
                        ..._args,
                        projectUuid,
                    });

                    const explore = exploreCtx.getExplore(
                        queryTool.queryConfig.exploreName,
                    );

                    const metricQuery = this.buildMetricQueryFromViz(
                        queryTool,
                        explore,
                    );

                    const results =
                        await this.asyncQueryService.executeMetricQueryAndGetResults(
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
                            content: [{ type: 'text' as const, text: NO_RESULTS_MESSAGE }],
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
                        CsvService.convertRowToCsv(row, results.fields, true, fieldIds),
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
                    const exploreUrl = `${this.lightdashConfig.siteUrl}${explorePath}${exploreParams}`;

                    return {
                        content: [
                            { type: 'text' as const, text: serializeData(csv, 'csv') },
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

    private registerSearchFieldValues(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.SEARCH_FIELD_VALUES,
            {
                description: toolSearchFieldValuesArgsSchema.description,
                inputSchema: this.compatSchema(toolSearchFieldValuesArgsSchema),
            },
            async (_args: AnyType, extra) => {
                const ctx = extra as McpProtocolContext;
                const args = _args as Omit<ToolSearchFieldValuesArgs, 'type'>;
                const projectUuid = await this.resolveProjectUuid(ctx);
                this.trackToolCall(
                    ctx,
                    BratraxMcpToolName.SEARCH_FIELD_VALUES,
                    projectUuid,
                );

                await this.requireProjectAccess(ctx, projectUuid);
                const { user } = ctx.authInfo!.extra;
                const attrOverrides = await this.getUserAttributeOverrides(ctx);

                const dimensionFilters = args.filters?.dimensions;
                // Wrap raw dimension filter rules in an AndFilterGroup
                // if they arrive as a flat array from the schema
                let andFilters: AnyType;
                if (dimensionFilters) {
                    if ('and' in dimensionFilters) {
                        andFilters = dimensionFilters;
                    } else if (Array.isArray(dimensionFilters)) {
                        andFilters = {
                            id: 'mcp-search-filter',
                            and: dimensionFilters,
                        };
                    }
                }

                const results =
                    await this.projectService.searchFieldUniqueValues(
                        user,
                        projectUuid,
                        args.table,
                        args.fieldId,
                        args.query ?? '',
                        100,
                        andFilters,
                        false,
                        undefined,
                        attrOverrides,
                    );

                return this.textResult(JSON.stringify(results, null, 2));
            },
        );
    }

    private registerGenerateDashboard(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.GENERATE_DASHBOARD,
            {
                description: toolDashboardV2ArgsSchema.description,
                inputSchema: this.compatSchema(toolDashboardV2ArgsSchema),
            },
            async (_args: AnyType, extra: AnyType) => {
                const ctx = extra as McpProtocolContext;
                const projectUuid = await this.resolveProjectUuid(ctx);
                this.trackToolCall(
                    ctx,
                    BratraxMcpToolName.GENERATE_DASHBOARD,
                    projectUuid,
                );

                try {
                    const { user } = ctx.authInfo!.extra;
                    await this.requireProjectAccess(ctx, projectUuid);

                    // Parse and transform input
                    const args: ToolDashboardV2ArgsTransformed =
                        toolDashboardV2ArgsSchemaTransformed.parse({
                            ..._args,
                            projectUuid,
                        });

                    const tags = await this.getTagsFromContext(ctx);
                    const attrOverrides =
                        await this.getUserAttributeOverrides(ctx);
                    const explores = await this.getAvailableExplores(
                        user,
                        projectUuid,
                        tags,
                        attrOverrides,
                    );
                    const exploreCtx = new ExploreContext(explores);

                    // Find first accessible space for the dashboard
                    const space =
                        await this.spaceModel.getFirstAccessibleSpace(
                            projectUuid,
                            user.userUuid,
                        );

                    // Validate each visualization in parallel
                    const vizResults = await Promise.allSettled(
                        args.visualizations.map(async (viz, idx) => {
                            const explore = exploreCtx.getExplore(
                                viz.queryConfig.exploreName,
                            );
                            const metricQuery = this.buildMetricQueryFromViz(
                                viz,
                                explore,
                            );

                            const chartType = this.mapChartType(
                                viz.chartConfig?.defaultVizType,
                            );

                            const chart: CreateSavedChart = {
                                name: viz.title || `Chart ${idx + 1}`,
                                description: viz.description || undefined,
                                tableName: viz.queryConfig.exploreName,
                                metricQuery,
                                chartConfig: {
                                    type: chartType,
                                    config: undefined,
                                },
                                tableConfig: {
                                    columnOrder: [],
                                },
                                pivotConfig: undefined,
                                parameters: undefined,
                                dashboardUuid: null as unknown as string, // set by createDashboardWithCharts
                            };
                            return chart;
                        }),
                    );

                    // Collect valid charts and errors
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
                            errors.push(
                                `Visualization ${idx + 1}: ${msg}`,
                            );
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

                    // Create the dashboard with all valid charts
                    const dashboardData: CreateDashboardWithCharts = {
                        name: args.title,
                        description: args.description,
                        spaceUuid: space.space_uuid,
                        charts: validCharts,
                    };

                    const dashboardService =
                        this.services.getDashboardService();
                    const dashboard =
                        await dashboardService.createDashboardWithCharts(
                            user,
                            projectUuid,
                            dashboardData,
                        );

                    const dashboardUrl = `${this.lightdashConfig.siteUrl}/projects/${projectUuid}/dashboards/${dashboard.uuid}`;

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

                    return this.textResult(JSON.stringify(result, null, 2));
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

    private registerGetEmbedUrl(): void {
        this.mcpServer.registerTool(
            BratraxMcpToolName.GET_EMBED_URL,
            {
                description: toolGetEmbedUrlArgsSchema.description,
                inputSchema: this.compatSchema(
                    toolGetEmbedUrlArgsSchema,
                ) as AnyType,
            },
            async (_args: AnyType, extra: AnyType) => {
                const ctx = extra as McpProtocolContext;
                const args = _args as ToolGetEmbedUrlArgs;
                const projectUuid = await this.resolveProjectUuid(ctx);
                this.trackToolCall(
                    ctx,
                    BratraxMcpToolName.GET_EMBED_URL,
                    projectUuid,
                );

                const result = await this.generateEmbedUrl(
                    args,
                    projectUuid,
                    ctx,
                );

                return this.textResult(result);
            },
        );
    }

    private async generateEmbedUrl(
        args: ToolGetEmbedUrlArgs,
        projectUuid: string,
        context: McpProtocolContext,
    ): Promise<string> {
        const { user, account } = context.authInfo!.extra;
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
                    this.services.getEmbedService<BratraxEmbedService>();

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
                );
                embedUrl = embedResult.url;

                title = `Dashboard ${args.resource_uuid}`;
                try {
                    const dashboardService =
                        this.services.getDashboardService();
                    const dashboard = await dashboardService.getByIdOrSlug(
                        user,
                        args.resource_uuid,
                    );
                    title = dashboard.name;
                } catch (error) {
                    this.logger.warn(
                        `Failed to get dashboard details: ${error}. Using default title.`,
                    );
                }
            } else if (resourceType === 'chart') {
                try {
                    const chart = await this.savedChartModel.get(
                        args.resource_uuid,
                    );

                    const space = await this.spaceModel.getSpaceSummary(
                        chart.spaceUuid,
                    );
                    const access = await this.spaceModel.getUserSpaceAccess(
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

                    const baseUrl = this.lightdashConfig.siteUrl;
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
}
