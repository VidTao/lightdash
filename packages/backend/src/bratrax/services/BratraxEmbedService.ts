import {
    type Account,
    addDashboardFiltersToMetricQuery,
    type AdditionalMetric,
    type AndFilterGroup,
    AnonymousAccount,
    type AnyType,
    type ApiExecuteAsyncDashboardChartQueryResults,
    type CacheMetadata,
    type CalculateSubtotalsFromQuery,
    type CalculateTotalFromQuery,
    CreateEmbedJwt,
    type Dashboard,
    type DashboardAvailableFilters,
    type DashboardDAO,
    type DashboardFilters,
    type DateGranularity,
    type DateZoom,
    EmbedContent,
    EmbedUrl,
    type ExecuteAsyncDashboardChartRequestParams,
    type Explore,
    type ExploreError,
    type FieldValueSearchResult,
    type FilterableDimension,
    ForbiddenError,
    formatRawRows,
    formatRows,
    getDashboardFiltersForTileAndTables,
    getDimensions,
    getItemId,
    type InteractivityOptions,
    isChartContent,
    isDashboardChartTileType,
    isDashboardSlugContent,
    isDashboardUuidContent,
    isExploreError,
    isFilterableDimension,
    isFilterInteractivityEnabled,
    isParameterInteractivityEnabled,
    type Item,
    type MetricQuery,
    NotFoundError,
    NotSupportedError,
    OssEmbed,
    type ParametersValuesMap,
    QueryExecutionContext,
    type RunQueryTags,
    type SavedChartsInfoForDashboardAvailableFilters,
    type SortField,
    UserAccessControls,
    UserAttributeValueMap,
} from '@lightdash/common';
import { randomBytes } from 'crypto';
import { isArray } from 'lodash';
import { Knex } from 'knex';
import { LightdashAnalytics } from '../../analytics/LightdashAnalytics';
import { fromJwt } from '../../auth/account';
import {
    decodeLightdashJwt,
    encodeLightdashJwt,
} from '../../auth/lightdashJwt';
import { LightdashConfig } from '../../config/parseConfig';
import Logger from '../../logging/logger';
import { DashboardModel } from '../../models/DashboardModel/DashboardModel';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SavedChartModel } from '../../models/SavedChartModel';
import { AsyncQueryService } from '../../services/AsyncQueryService/AsyncQueryService';
import { BaseService } from '../../services/BaseService';
import {
    getAvailableParameterDefinitions,
    getDashboardParametersValuesMap,
} from '../../services/ProjectService/parameters';
import { ProjectService } from '../../services/ProjectService/ProjectService';
import { getFilteredExplore } from '../../services/UserAttributesService/UserAttributeUtils';
import { SubtotalsCalculator } from '../../utils/SubtotalsCalculator';
import { EncryptionUtil } from '../../utils/EncryptionUtil/EncryptionUtil';
import { wrapSentryTransaction } from '../../utils';

type BratraxEmbedServiceDeps = {
    database: Knex;
    lightdashConfig: LightdashConfig;
    dashboardModel: DashboardModel;
    asyncQueryService: AsyncQueryService;
    projectModel: ProjectModel;
    savedChartModel: SavedChartModel;
    analytics: LightdashAnalytics;
};

export class BratraxEmbedService extends BaseService {
    private readonly database: Knex;

    private readonly lightdashConfig: LightdashConfig;

    private readonly encryptionUtil: EncryptionUtil;

    private readonly dashboardModel: DashboardModel;

    private readonly asyncQueryService: AsyncQueryService;

    private readonly projectModel: ProjectModel;

    private readonly savedChartModel: SavedChartModel;

    private readonly analytics: LightdashAnalytics;

    constructor({
        database,
        lightdashConfig,
        dashboardModel,
        asyncQueryService,
        projectModel,
        savedChartModel,
        analytics,
    }: BratraxEmbedServiceDeps) {
        super();
        this.database = database;
        this.lightdashConfig = lightdashConfig;
        this.encryptionUtil = new EncryptionUtil({ lightdashConfig });
        this.dashboardModel = dashboardModel;
        this.asyncQueryService = asyncQueryService;
        this.projectModel = projectModel;
        this.savedChartModel = savedChartModel;
        this.analytics = analytics;
    }

    // ─── Embed config & JWT ────────────────────────────────────────────

    /**
     * Auto-provisions the embedding row for a project if it doesn't exist.
     * Generates a random secret, encrypts it, and inserts into the
     * `embedding` table. Uses ON CONFLICT to avoid races.
     */
    private async ensureEmbedConfigured(
        projectUuid: string,
        userUuid?: string,
    ): Promise<Buffer> {
        const existing = await this.database('embedding')
            .select('encoded_secret')
            .where('project_uuid', projectUuid)
            .first();

        if (existing) {
            return existing.encoded_secret;
        }

        const secret = randomBytes(32).toString('base64url');
        const encodedSecret = this.encryptionUtil.encrypt(secret);

        await this.database('embedding')
            .insert({
                project_uuid: projectUuid,
                encoded_secret: encodedSecret,
                dashboard_uuids: '{}',
                chart_uuids: '{}',
                allow_all_dashboards: false,
                allow_all_charts: false,
                created_by: userUuid ?? null,
            })
            .onConflict('project_uuid')
            .merge();

        Logger.info(
            `Auto-provisioned embed config for project ${projectUuid}`,
        );

        const row = await this.database('embedding')
            .select('encoded_secret')
            .where('project_uuid', projectUuid)
            .first();

        return row!.encoded_secret;
    }

    private async getEmbedConfig(projectUuid: string): Promise<OssEmbed> {
        const row = await this.database('embedding')
            .select(
                'embedding.project_uuid',
                'embedding.encoded_secret',
                'embedding.dashboard_uuids',
                'embedding.allow_all_dashboards',
                'embedding.allow_all_charts',
                'embedding.created_at',
                'embedding.created_by',
                'users.user_uuid',
                'users.first_name',
                'users.last_name',
                'organizations.organization_uuid',
                'organizations.organization_name',
                'organizations.created_at as org_created_at',
            )
            .leftJoin('users', 'embedding.created_by', 'users.user_uuid')
            .leftJoin(
                'projects',
                'projects.project_uuid',
                'embedding.project_uuid',
            )
            .leftJoin(
                'organizations',
                'organizations.organization_id',
                'projects.organization_id',
            )
            .where('embedding.project_uuid', projectUuid)
            .first();

        if (!row) {
            throw new NotFoundError(
                `Embed config not found for project ${projectUuid}`,
            );
        }

        return {
            projectUuid: row.project_uuid,
            organization: {
                organizationUuid: row.organization_uuid,
                name: row.organization_name,
                createdAt: row.org_created_at,
            },
            encodedSecret: row.encoded_secret,
            dashboardUuids: row.dashboard_uuids ?? [],
            allowAllDashboards: row.allow_all_dashboards ?? false, // JWT is the primary permission boundary
            chartUuids: row.chart_uuids ?? [],
            allowAllCharts: row.allow_all_charts ?? false, // JWT is the primary permission boundary
            createdAt: row.created_at,
            user: row.user_uuid
                ? {
                      userUuid: row.user_uuid,
                      firstName: row.first_name,
                      lastName: row.last_name,
                  }
                : null,
        };
    }

    // eslint-disable-next-line class-methods-use-this
    private getContentFromJwt(decodedToken: CreateEmbedJwt): EmbedContent {
        if (isChartContent(decodedToken.content)) {
            return {
                type: 'chart',
                dashboardUuid: undefined,
                chartUuids: [decodedToken.content.contentId],
                explores: [],
            };
        }

        if (isDashboardUuidContent(decodedToken.content)) {
            return {
                type: 'dashboard',
                dashboardUuid: decodedToken.content.dashboardUuid,
                chartUuids: [],
                explores: [],
            };
        }

        if (isDashboardSlugContent(decodedToken.content)) {
            return {
                type: 'dashboard',
                dashboardUuid: undefined,
                chartUuids: [],
                explores: [],
            };
        }

        return {
            type: 'dashboard',
            dashboardUuid: undefined,
            chartUuids: [],
            explores: [],
        };
    }

    private async getEmbedUserAttributes(
        organizationUuid: string,
        embedJwt: CreateEmbedJwt,
    ): Promise<UserAccessControls> {
        const orgUserAttributes = await this.database('user_attributes')
            .select('name', 'attribute_default')
            .where(
                'organization_id',
                this.database('organizations')
                    .select('organization_id')
                    .where('organization_uuid', organizationUuid)
                    .first(),
            );

        const defaultUserAttributes =
            orgUserAttributes.reduce<UserAttributeValueMap>((acc, curr) => {
                acc[curr.name] = curr.attribute_default
                    ? [curr.attribute_default]
                    : [];
                return acc;
            }, {});

        const embedTokenUserAttributes = embedJwt.userAttributes
            ? Object.entries(
                  embedJwt.userAttributes,
              ).reduce<UserAttributeValueMap>((acc, [key, value]) => {
                  if (value !== null && value !== undefined) {
                      let sanitizedValue: string[];
                      if (typeof value === 'string') {
                          sanitizedValue = [value];
                      } else if (isArray(value)) {
                          sanitizedValue = (value as unknown[]).map((v) =>
                              typeof v === 'string' ? v : JSON.stringify(v),
                          );
                      } else {
                          sanitizedValue = [JSON.stringify(value)];
                      }
                      acc[key] = sanitizedValue;
                  }
                  return acc;
              }, {})
            : {};

        return {
            userAttributes: {
                ...defaultUserAttributes,
                ...embedTokenUserAttributes,
            },
            intrinsicUserAttributes: {
                email: embedJwt.user?.email,
            },
        };
    }

    async getAccountFromJwt(
        projectUuid: string,
        encodedJwt: string,
    ): Promise<AnonymousAccount> {
        return wrapSentryTransaction(
            'BratraxEmbedService.getAccountFromJwt',
            { project_uuid: projectUuid },
            async () => {
                const embed = await this.getEmbedConfig(projectUuid);
                const decodedToken = decodeLightdashJwt(
                    encodedJwt,
                    embed.encodedSecret,
                );

                const [userAttributes, content] = await Promise.all([
                    this.getEmbedUserAttributes(
                        embed.organization.organizationUuid,
                        decodedToken,
                    ),
                    Promise.resolve(this.getContentFromJwt(decodedToken)),
                ]);

                return fromJwt({
                    decodedToken,
                    source: encodedJwt,
                    embed,
                    content,
                    userAttributes,
                });
            },
        );
    }

    async getEmbedUrl(
        projectUuid: string,
        jwtData: CreateEmbedJwt,
        expiresIn: string = '1h',
        userUuid?: string,
    ): Promise<EmbedUrl> {
        const encodedSecret = await this.ensureEmbedConfigured(
            projectUuid,
            userUuid,
        );

        const jwtToken = encodeLightdashJwt(jwtData, encodedSecret, expiresIn);

        let urlPath: string;
        if (jwtData.content.type === 'chart') {
            urlPath = `/embed/${projectUuid}/chart/${jwtData.content.contentId}#${jwtToken}`;
        } else {
            urlPath = `/embed/${projectUuid}#${jwtToken}`;
        }

        const url = new URL(urlPath, this.lightdashConfig.siteUrl);
        return { url: url.href };
    }

    // ─── Core private helpers ──────────────────────────────────────────

    // eslint-disable-next-line class-methods-use-this
    private getAccessControls(account: AnonymousAccount): UserAccessControls {
        const { userAttributes, intrinsicUserAttributes } =
            account.access.controls ?? {};
        if (!userAttributes || !intrinsicUserAttributes) {
            throw new ForbiddenError(
                'User attributes are required for embed queries',
            );
        }
        return { userAttributes, intrinsicUserAttributes };
    }

    private async _getWarehouseClient(projectUuid: string, explore: Explore) {
        const credentials =
            await this.projectModel.getWarehouseCredentialsForProject(
                projectUuid,
            );

        return this.asyncQueryService._getWarehouseClient(
            projectUuid,
            credentials,
            {
                snowflakeVirtualWarehouse: explore.warehouse,
                databricksCompute: explore.databricksCompute,
            },
        );
    }

    private async getAvailableParameters(
        projectUuid: string,
        explore: Explore,
    ) {
        const projectParameters =
            await this.asyncQueryService.projectParametersModel.find(
                projectUuid,
            );
        return getAvailableParameterDefinitions(projectParameters, explore);
    }

    private async _runEmbedQuery({
        projectUuid,
        metricQuery,
        explore,
        queryTags,
        account,
        dateZoomGranularity,
        combinedParameters,
    }: {
        projectUuid: string;
        metricQuery: MetricQuery;
        explore: Explore;
        queryTags: Omit<
            Required<RunQueryTags>,
            'user_uuid' | 'chart_uuid' | 'dashboard_uuid'
        > & {
            embed: 'true';
            external_id: string;
            chart_uuid?: string;
            dashboard_uuid?: string;
        };
        account: AnonymousAccount;
        dateZoomGranularity?: DateGranularity;
        combinedParameters?: ParametersValuesMap;
    }) {
        const { warehouseClient, sshTunnel } = await this._getWarehouseClient(
            projectUuid,
            explore,
        );

        const { userAttributes, intrinsicUserAttributes } =
            this.getAccessControls(account);

        const filteredExplore = getFilteredExplore(explore, userAttributes);

        const availableParameterDefinitions =
            await this.getAvailableParameters(projectUuid, filteredExplore);

        const compiledQuery = await ProjectService._compileQuery({
            metricQuery,
            explore: filteredExplore,
            warehouseSqlBuilder: warehouseClient,
            intrinsicUserAttributes,
            userAttributes,
            timezone: this.lightdashConfig.query.timezone || 'UTC',
            dateZoom: dateZoomGranularity
                ? { granularity: dateZoomGranularity }
                : undefined,
            parameters: combinedParameters,
            availableParameterDefinitions,
        });

        const results =
            await this.asyncQueryService.getResultsFromCacheOrWarehouse({
                projectUuid,
                userUuid: null,
                context: QueryExecutionContext.EMBED,
                warehouseClient,
                metricQuery,
                query: compiledQuery.query,
                queryTags,
                invalidateCache: false,
            });

        await sshTunnel.disconnect();
        return { ...results, fields: compiledQuery.fields };
    }

    private async _getChartFromDashboardTiles(
        dashboard: DashboardDAO,
        tileUuid: string,
    ) {
        const tile = dashboard.tiles
            .filter(isDashboardChartTileType)
            .find(({ uuid }) => uuid === tileUuid);

        if (!tile) {
            throw new NotFoundError(
                `Tile ${tileUuid} not found in dashboard ${dashboard.uuid}`,
            );
        }

        const chartUuid = tile.properties.savedChartUuid;
        if (chartUuid === null) {
            throw new NotFoundError(
                `Tile ${tileUuid} does not have a saved chart uuid`,
            );
        }

        return this.savedChartModel.get(chartUuid);
    }

    // eslint-disable-next-line class-methods-use-this
    private _getAppliedDashboardFilters(
        account: AnonymousAccount,
        explore: Explore,
        dashboard: DashboardDAO,
        tileUuid: string,
        dashboardFilters?: DashboardFilters,
    ) {
        const tables = Object.keys(explore.tables);

        let appliedDashboardFilters = getDashboardFiltersForTileAndTables(
            tileUuid,
            tables,
            dashboard.filters,
        );

        if (
            dashboardFilters &&
            isFilterInteractivityEnabled(account.access.filtering)
        ) {
            appliedDashboardFilters = getDashboardFiltersForTileAndTables(
                tileUuid,
                tables,
                dashboardFilters,
            );
        }

        return appliedDashboardFilters;
    }

    // ─── Embed rendering methods ───────────────────────────────────────

    async getDashboard(
        projectUuid: string,
        account: AnonymousAccount,
    ): Promise<Dashboard & InteractivityOptions> {
        const dashboardUuid = account.access.content.dashboardUuid;
        if (!dashboardUuid) {
            throw new NotFoundError(
                'No dashboard UUID found in embed token',
            );
        }

        const dashboard =
            await this.dashboardModel.getByIdOrSlug(dashboardUuid);

        const jwtContent = account.authentication.data.content;
        const { canExportCsv, canExportImages, canViewUnderlyingData } =
            jwtContent;
        const isPreview =
            'isPreview' in jwtContent ? jwtContent.isPreview : undefined;
        const canExportPagePdf =
            'canExportPagePdf' in jwtContent
                ? jwtContent.canExportPagePdf
                : true;
        const canDateZoom =
            'canDateZoom' in jwtContent ? jwtContent.canDateZoom : undefined;

        this.analytics.track({
            event: 'embed_dashboard.viewed',
            anonymousId: 'embed',
            properties: {
                organizationId: dashboard.organizationUuid,
                projectId: projectUuid,
                dashboardId: dashboard.uuid,
                externalId: account.user.id,
                context: isPreview ? 'preview' : 'production',
                tilesCount: dashboard.tiles.length,
                chartTilesCount: dashboard.tiles.filter(
                    isDashboardChartTileType,
                ).length,
                canExportCsv,
                canExportImages,
                canExportPagePdf: canExportPagePdf ?? true,
                canDateZoom,
            },
        });

        return {
            ...dashboard,
            isPrivate: false,
            access: [],
            dashboardFiltersInteractivity: account.access.filtering,
            parameterInteractivity: account.access.parameters,
            canExportCsv,
            canExportImages,
            canExportPagePdf: canExportPagePdf ?? true,
            canDateZoom,
            canViewUnderlyingData,
        } as Dashboard & InteractivityOptions;
    }

    async executeAsyncDashboardTileQuery({
        account,
        projectUuid,
        tileUuid,
        dashboardFilters,
        dateZoom,
        invalidateCache,
        dashboardSorts,
        parameters,
        pivotResults,
    }: {
        account: AnonymousAccount;
        projectUuid: string;
        tileUuid: string;
    } & Pick<
        ExecuteAsyncDashboardChartRequestParams,
        | 'dashboardFilters'
        | 'dashboardSorts'
        | 'pivotResults'
        | 'invalidateCache'
        | 'dateZoom'
        | 'parameters'
    >): Promise<ApiExecuteAsyncDashboardChartQueryResults> {
        const dashboardUuid = account.access.content.dashboardUuid;
        if (!dashboardUuid) {
            throw new NotFoundError(
                'No dashboard UUID found in embed token',
            );
        }

        const dashboard =
            await this.dashboardModel.getByIdOrSlug(dashboardUuid);

        const chart = await this._getChartFromDashboardTiles(
            dashboard,
            tileUuid,
        );

        const explore = await this.projectModel.getExploreFromCache(
            projectUuid,
            chart.tableName,
        );
        if (isExploreError(explore)) {
            throw new ForbiddenError(
                `Explore ${chart.tableName} on project ${projectUuid} has errors: ${explore.errors}`,
            );
        }

        const appliedDashboardFilters = this._getAppliedDashboardFilters(
            account,
            explore,
            dashboard,
            tileUuid,
            dashboardFilters,
        );

        this.analytics.track({
            event: 'embed_query.executed',
            anonymousId: 'embed',
            properties: {
                organizationId: chart.organizationUuid,
                projectId: projectUuid,
                dashboardId: dashboardUuid,
                chartId: chart.uuid,
                externalId: account.user.id,
            },
        });

        const dashboardParameters = getDashboardParametersValuesMap(dashboard);
        const acceptedUserParameters =
            isParameterInteractivityEnabled(account.access.parameters) &&
            parameters
                ? parameters
                : {};
        const combinedParameters =
            await this.asyncQueryService.combineParameters(
                projectUuid,
                explore,
                acceptedUserParameters,
                dashboardParameters,
            );

        return this.asyncQueryService.executeAsyncDashboardChartQuery({
            account: account as Account,
            projectUuid,
            chartUuid: chart.uuid,
            tileUuid,
            dashboardSorts: dashboardSorts ?? [],
            dashboardUuid,
            dashboardFilters: appliedDashboardFilters,
            dateZoom,
            invalidateCache,
            limit: undefined,
            context: QueryExecutionContext.EMBED,
            parameters: combinedParameters,
            pivotResults,
        });
    }

    async getChartAndResults(
        projectUuid: string,
        account: AnonymousAccount,
        tileUuid: string,
        dashboardFilters?: DashboardFilters,
        dateZoomGranularity?: DateGranularity,
        dashboardSorts?: SortField[],
        userParameters?: ParametersValuesMap,
    ) {
        const dashboardUuid = account.access.content.dashboardUuid;
        if (!dashboardUuid) {
            throw new NotFoundError(
                'No dashboard UUID found in embed token',
            );
        }

        const dashboard =
            await this.dashboardModel.getByIdOrSlug(dashboardUuid);

        const chart = await this._getChartFromDashboardTiles(
            dashboard,
            tileUuid,
        );

        const { organizationUuid } = chart;

        const explore = await this.projectModel.getExploreFromCache(
            projectUuid,
            chart.tableName,
        );
        if (isExploreError(explore)) {
            throw new ForbiddenError(
                `Explore ${chart.tableName} on project ${projectUuid} has errors: ${explore.errors}`,
            );
        }

        const appliedDashboardFilters = this._getAppliedDashboardFilters(
            account,
            explore,
            dashboard,
            tileUuid,
            dashboardFilters,
        );

        const metricQueryWithDashboardSorts =
            dashboardSorts && dashboardSorts.length > 0
                ? { ...chart.metricQuery, sorts: dashboardSorts }
                : chart.metricQuery;

        const metricQueryWithDashboardOverrides: MetricQuery = {
            ...addDashboardFiltersToMetricQuery(
                metricQueryWithDashboardSorts,
                appliedDashboardFilters,
                explore,
            ),
        };

        this.analytics.track({
            event: 'embed_query.executed',
            anonymousId: 'embed',
            properties: {
                organizationId: organizationUuid,
                projectId: projectUuid,
                dashboardId: dashboardUuid,
                chartId: chart.uuid,
                externalId: account.user.id,
            },
        });

        const dashboardParameters = getDashboardParametersValuesMap(dashboard);
        const acceptedUserParameters =
            isParameterInteractivityEnabled(account.access.parameters) &&
            userParameters
                ? userParameters
                : {};
        const combinedParameters =
            await this.asyncQueryService.combineParameters(
                projectUuid,
                explore,
                acceptedUserParameters,
                dashboardParameters,
            );

        const { rows, cacheMetadata, fields } = await this._runEmbedQuery({
            projectUuid,
            metricQuery: metricQueryWithDashboardOverrides,
            explore,
            queryTags: {
                embed: 'true',
                external_id: account.user.id,
                project_uuid: projectUuid,
                organization_uuid: organizationUuid,
                chart_uuid: chart.uuid,
                dashboard_uuid: dashboardUuid,
                explore_name: chart.tableName,
                query_context: QueryExecutionContext.EMBED,
            },
            account,
            dateZoomGranularity,
            combinedParameters,
        });

        return {
            appliedDashboardFilters: undefined,
            chart: {
                ...chart,
                isPrivate: false,
                access: [],
            },
            explore,
            rows: formatRows(rows, fields),
            cacheMetadata,
            metricQuery: metricQueryWithDashboardOverrides,
            fields,
        };
    }

    async getAvailableFiltersForSavedQueries(
        projectUuid: string,
        account: AnonymousAccount,
        savedChartUuidsAndTileUuids: SavedChartsInfoForDashboardAvailableFilters,
    ): Promise<DashboardAvailableFilters> {
        if (!isFilterInteractivityEnabled(account.access.filtering)) {
            return {
                savedQueryFilters: {},
                allFilterableFields: [],
            };
        }

        const savedQueryUuids = savedChartUuidsAndTileUuids.map(
            ({ savedChartUuid }) => savedChartUuid,
        );

        const savedCharts =
            await this.savedChartModel.getInfoForAvailableFilters(
                savedQueryUuids,
            );

        const exploreCacheKeys: Record<string, boolean> = {};
        const exploreCache: Record<string, Explore | ExploreError> = {};

        const explorePromises = savedCharts.reduce<
            Promise<{ key: string; explore: Explore | ExploreError }>[]
        >((acc, chart) => {
            const key = chart.tableName;
            if (!exploreCacheKeys[key]) {
                const cachedExplore = this.projectModel.getExploreFromCache(
                    projectUuid,
                    key,
                );
                acc.push(cachedExplore.then((explore) => ({ key, explore })));
                exploreCacheKeys[key] = true;
            }
            return acc;
        }, []);

        const resolvedExplores = await Promise.all(explorePromises);
        resolvedExplores.forEach(({ key, explore }) => {
            exploreCache[key] = explore;
        });

        const allFilters = await Promise.all(
            savedCharts.map(async (savedChart) => {
                const explore = exploreCache[savedChart.tableName];
                if (isExploreError(explore))
                    return { uuid: savedChart.uuid, filters: [] };
                const filters = getDimensions(explore).filter(
                    (field) =>
                        isFilterableDimension(field) && !field.hidden,
                ) as FilterableDimension[];
                return { uuid: savedChart.uuid, filters };
            }),
        );

        const allFilterableFields: FilterableDimension[] = [];
        const filterIndexMap: Record<string, number> = {};

        allFilters.forEach((filterSet) => {
            filterSet.filters.forEach((filter) => {
                const fieldId = getItemId(filter);
                if (!(fieldId in filterIndexMap)) {
                    filterIndexMap[fieldId] = allFilterableFields.length;
                    allFilterableFields.push(filter);
                }
            });
        });

        const savedQueryFilters = savedChartUuidsAndTileUuids.reduce<
            DashboardAvailableFilters['savedQueryFilters']
        >((acc, savedChartUuidAndTileUuid) => {
            const filterResult = allFilters.find(
                (result) =>
                    result.uuid === savedChartUuidAndTileUuid.savedChartUuid,
            );
            if (!filterResult || !filterResult.filters.length) return acc;

            const filterIndexes = filterResult.filters.map(
                (filter) => filterIndexMap[getItemId(filter)],
            );
            return {
                ...acc,
                [savedChartUuidAndTileUuid.tileUuid]: filterIndexes,
            };
        }, {});

        return {
            savedQueryFilters,
            allFilterableFields,
        };
    }

    // ─── Calculation methods ───────────────────────────────────────────

    private async _prepareSavedChartForCalculation(
        account: AnonymousAccount,
        projectUuid: string,
        savedChartUuid: string,
        dashboardFilters?: DashboardFilters,
    ) {
        const { type, dashboardUuid, chartUuids } = account.access.content;

        if (type === 'chart') {
            if (!chartUuids.includes(savedChartUuid)) {
                throw new ForbiddenError(
                    `Not authorized to access chart ${savedChartUuid}`,
                );
            }

            const chart = await this.savedChartModel.get(savedChartUuid);
            if (chart.projectUuid !== projectUuid) {
                throw new NotFoundError(
                    `Chart ${savedChartUuid} not found in project ${projectUuid}`,
                );
            }

            const explore = await this.projectModel.getExploreFromCache(
                projectUuid,
                chart.tableName,
            );
            if (isExploreError(explore)) {
                throw new ForbiddenError(
                    `Explore ${chart.tableName} on project ${projectUuid} has errors: ${explore.errors}`,
                );
            }

            return {
                dashboardUuid: undefined,
                chart,
                explore,
                metricQuery: chart.metricQuery,
            };
        }

        if (!dashboardUuid) {
            throw new NotFoundError(
                'Dashboard ID is required for this operation',
            );
        }

        const dashboard =
            await this.dashboardModel.getByIdOrSlug(dashboardUuid);

        const tile = dashboard.tiles
            .filter(isDashboardChartTileType)
            .find(
                ({ properties }) =>
                    properties.savedChartUuid === savedChartUuid,
            );

        if (!tile) {
            throw new NotFoundError(
                `Tile for saved chart ${savedChartUuid} not found`,
            );
        }

        if (!tile.properties.savedChartUuid) {
            throw new NotFoundError(
                `Tile ${savedChartUuid} does not have a saved chart uuid`,
            );
        }

        const chart = await this._getChartFromDashboardTiles(
            dashboard,
            tile.uuid,
        );

        const explore = await this.projectModel.getExploreFromCache(
            projectUuid,
            chart.tableName,
        );
        if (isExploreError(explore)) {
            throw new ForbiddenError(
                `Explore ${chart.tableName} on project ${projectUuid} has errors: ${explore.errors}`,
            );
        }

        const appliedDashboardFilters = this._getAppliedDashboardFilters(
            account,
            explore,
            dashboard,
            tile.uuid,
            dashboardFilters,
        );
        const metricQuery = appliedDashboardFilters
            ? addDashboardFiltersToMetricQuery(
                  chart.metricQuery,
                  appliedDashboardFilters,
              )
            : chart.metricQuery;

        return {
            dashboardUuid,
            chart,
            explore,
            metricQuery,
        };
    }

    async calculateTotalFromSavedChart(
        account: AnonymousAccount,
        projectUuid: string,
        savedChartUuid: string,
        dashboardFilters?: DashboardFilters,
        userParameters?: ParametersValuesMap,
        invalidateCache?: boolean,
    ) {
        const { dashboardUuid, chart, explore, metricQuery } =
            await this._prepareSavedChartForCalculation(
                account,
                projectUuid,
                savedChartUuid,
                dashboardFilters,
            );

        const { warehouseClient } = await this._getWarehouseClient(
            projectUuid,
            explore,
        );

        const { userAttributes, intrinsicUserAttributes } =
            this.getAccessControls(account);

        const dashboardParameters = dashboardUuid
            ? getDashboardParametersValuesMap(
                  await this.dashboardModel.getByIdOrSlug(dashboardUuid),
              )
            : {};
        const acceptedUserParameters =
            isParameterInteractivityEnabled(account.access.parameters) &&
            userParameters
                ? userParameters
                : {};
        const combinedParameters =
            await this.asyncQueryService.combineParameters(
                projectUuid,
                explore,
                acceptedUserParameters,
                dashboardParameters,
            );

        const availableParameterDefinitions =
            await this.getAvailableParameters(projectUuid, explore);

        try {
            const { totalQuery: totalMetricQuery } =
                await this.asyncQueryService._getCalculateTotalQuery(
                    userAttributes,
                    intrinsicUserAttributes,
                    explore,
                    metricQuery,
                    warehouseClient,
                    availableParameterDefinitions,
                    combinedParameters,
                );

            const { rows } = await this._runEmbedQuery({
                projectUuid,
                metricQuery: totalMetricQuery,
                explore,
                queryTags: {
                    embed: 'true',
                    external_id: account.user.id,
                    project_uuid: projectUuid,
                    organization_uuid: chart.organizationUuid,
                    chart_uuid: chart.uuid,
                    dashboard_uuid: dashboardUuid,
                    explore_name: chart.tableName,
                    query_context: QueryExecutionContext.CALCULATE_TOTAL,
                },
                account,
                combinedParameters,
            });

            if (rows.length === 0) {
                throw new NotFoundError('No results found');
            }

            return rows[0];
        } catch (e) {
            if (e instanceof NotSupportedError) {
                this.logger.warn(e.message);
                return {};
            }
            throw e;
        }
    }

    async calculateSubtotalsFromSavedChart(
        account: AnonymousAccount,
        projectUuid: string,
        savedChartUuid: string,
        dashboardFilters?: DashboardFilters,
        userParameters?: ParametersValuesMap,
        columnOrder?: string[],
        pivotDimensions?: string[],
        invalidateCache?: boolean,
        dateZoom?: DateZoom,
    ) {
        const { dashboardUuid, chart, explore, metricQuery } =
            await this._prepareSavedChartForCalculation(
                account,
                projectUuid,
                savedChartUuid,
                dashboardFilters,
            );

        const finalColumnOrder = columnOrder || [
            ...metricQuery.dimensions,
            ...metricQuery.metrics,
            ...(metricQuery.additionalMetrics?.map((m) => m.name) || []),
        ];

        const dashboardParameters = dashboardUuid
            ? getDashboardParametersValuesMap(
                  await this.dashboardModel.getByIdOrSlug(dashboardUuid),
              )
            : {};
        const acceptedUserParameters =
            isParameterInteractivityEnabled(account.access.parameters) &&
            userParameters
                ? userParameters
                : {};
        const combinedParameters =
            await this.asyncQueryService.combineParameters(
                projectUuid,
                explore,
                acceptedUserParameters,
                dashboardParameters,
            );

        return this._calculateSubtotalsForEmbed(
            account,
            projectUuid,
            explore,
            metricQuery,
            finalColumnOrder,
            pivotDimensions,
            chart.organizationUuid,
            chart.uuid,
            dashboardUuid,
            combinedParameters,
            dateZoom,
        );
    }

    private async _calculateSubtotalsForEmbed(
        account: AnonymousAccount,
        projectUuid: string,
        explore: Explore,
        metricQuery: MetricQuery,
        columnOrder: string[],
        pivotDimensions?: string[],
        organizationUuid?: string,
        chartUuid?: string,
        dashboardUuid?: string,
        combinedParameters?: ParametersValuesMap,
        dateZoom?: DateZoom,
    ) {
        const { dimensionGroupsToSubtotal, analyticsData } =
            SubtotalsCalculator.prepareDimensionGroups(
                metricQuery,
                columnOrder,
                pivotDimensions,
            );

        this.analytics.track({
            event: 'embed_query.subtotal',
            anonymousId: 'embed',
            properties: {
                organizationId: organizationUuid,
                projectId: projectUuid,
                dashboardId: dashboardUuid,
                chartId: chartUuid,
                exploreName: explore.name,
                externalId: account.user.id,
                ...analyticsData,
            },
        });

        const subtotalsPromises = dimensionGroupsToSubtotal.map<
            Promise<[string, Record<string, unknown>[]]>
        >(async (subtotalDimensions) => {
            let subtotals: Record<string, unknown>[] = [];

            try {
                const { metricQuery: subtotalMetricQuery } =
                    SubtotalsCalculator.createSubtotalQueryConfig(
                        metricQuery,
                        subtotalDimensions,
                        pivotDimensions,
                    );

                const { rows, fields } = await this._runEmbedQuery({
                    projectUuid,
                    metricQuery: subtotalMetricQuery,
                    explore,
                    queryTags: {
                        embed: 'true',
                        external_id: account.user.id,
                        project_uuid: projectUuid,
                        organization_uuid: organizationUuid || '',
                        chart_uuid: chartUuid || '',
                        dashboard_uuid: dashboardUuid || '',
                        explore_name: explore.name,
                        query_context:
                            QueryExecutionContext.CALCULATE_SUBTOTAL,
                    },
                    account,
                    combinedParameters,
                    dateZoomGranularity: dateZoom?.granularity,
                });

                subtotals = formatRawRows(rows, fields) as Record<
                    string,
                    number
                >[];
            } catch (e) {
                this.logger.error(
                    `Error running subtotal query for dimensions ${subtotalDimensions.join(
                        ',',
                    )}`,
                );
            }

            return [
                SubtotalsCalculator.getSubtotalKey(subtotalDimensions),
                subtotals,
            ] satisfies [string, Record<string, unknown>[]];
        });

        const subtotalsEntries = await Promise.all(subtotalsPromises);
        return SubtotalsCalculator.formatSubtotalEntries(subtotalsEntries);
    }

    async calculateTotalFromQuery(
        account: AnonymousAccount,
        projectUuid: string,
        data: CalculateTotalFromQuery,
    ): Promise<Record<string, number>> {
        const { organizationUuid } =
            await this.projectModel.getSummary(projectUuid);

        const explore = await this.projectModel.getExploreFromCache(
            projectUuid,
            data.explore,
        );
        if (isExploreError(explore)) {
            throw new ForbiddenError(
                `Explore ${data.explore} on project ${projectUuid} has errors: ${explore.errors}`,
            );
        }

        const { warehouseClient } = await this._getWarehouseClient(
            projectUuid,
            explore,
        );

        const { userAttributes, intrinsicUserAttributes } =
            this.getAccessControls(account);

        const acceptedUserParameters =
            isParameterInteractivityEnabled(account.access.parameters) &&
            data.parameters
                ? data.parameters
                : {};
        const combinedParameters =
            await this.asyncQueryService.combineParameters(
                projectUuid,
                explore,
                acceptedUserParameters,
            );

        const availableParameterDefinitions =
            await this.getAvailableParameters(projectUuid, explore);

        try {
            const { totalQuery: totalMetricQuery } =
                await this.asyncQueryService._getCalculateTotalQuery(
                    userAttributes,
                    intrinsicUserAttributes,
                    explore,
                    data.metricQuery,
                    warehouseClient,
                    availableParameterDefinitions,
                    combinedParameters,
                );

            const { rows } = await this._runEmbedQuery({
                projectUuid,
                metricQuery: totalMetricQuery,
                explore,
                queryTags: {
                    embed: 'true',
                    external_id: account.user.id,
                    project_uuid: projectUuid,
                    organization_uuid: organizationUuid,
                    dashboard_uuid: '',
                    explore_name: data.explore,
                    query_context: QueryExecutionContext.CALCULATE_TOTAL,
                },
                account,
                combinedParameters,
            });

            if (rows.length === 0) {
                throw new NotFoundError('No results found');
            }

            return rows[0] as Record<string, number>;
        } catch (e) {
            if (e instanceof NotSupportedError) {
                this.logger.warn(e.message);
                return {};
            }
            throw e;
        }
    }

    async calculateSubtotalsFromQuery(
        account: AnonymousAccount,
        projectUuid: string,
        data: CalculateSubtotalsFromQuery,
    ) {
        const { organizationUuid } =
            await this.projectModel.getSummary(projectUuid);

        const explore = await this.projectModel.getExploreFromCache(
            projectUuid,
            data.explore,
        );
        if (isExploreError(explore)) {
            throw new ForbiddenError(
                `Explore ${data.explore} on project ${projectUuid} has errors: ${explore.errors}`,
            );
        }

        const acceptedUserParameters =
            isParameterInteractivityEnabled(account.access.parameters) &&
            data.parameters
                ? data.parameters
                : {};
        const combinedParameters =
            await this.asyncQueryService.combineParameters(
                projectUuid,
                explore,
                acceptedUserParameters,
            );

        return this._calculateSubtotalsForEmbed(
            account,
            projectUuid,
            explore,
            data.metricQuery,
            data.columnOrder,
            data.pivotDimensions,
            organizationUuid,
            undefined,
            undefined,
            combinedParameters,
            data.dateZoom,
        );
    }

    // ─── Filter search ─────────────────────────────────────────────────

    async searchFilterValues({
        account,
        projectUuid,
        filterUuid,
        search,
        limit,
        filters,
        forceRefresh,
    }: {
        account: AnonymousAccount;
        projectUuid: string;
        filterUuid: string;
        search: string;
        limit: number;
        filters: AndFilterGroup | undefined;
        forceRefresh: boolean;
    }): Promise<FieldValueSearchResult> {
        const dashboardUuid = account.access.content.dashboardUuid;
        if (!dashboardUuid) {
            throw new NotFoundError(
                'Dashboard ID is required for this operation',
            );
        }

        const dashboard =
            await this.dashboardModel.getByIdOrSlug(dashboardUuid);

        const dashboardDimensionFilters = dashboard.filters.dimensions;
        const filter = dashboardDimensionFilters.find(
            (f) => f.id === filterUuid,
        );
        if (!filter) {
            throw new NotFoundError(`Filter ${filterUuid} not found`);
        }

        const initialFieldId = filter.target.fieldId;
        const { metricQuery, explore, field } =
            await this.asyncQueryService._getFieldValuesMetricQuery({
                projectUuid,
                table: filter.target.tableName,
                initialFieldId,
                search,
                limit,
                filters,
            });

        const { rows, cacheMetadata } = await this._runEmbedQuery({
            projectUuid: dashboard.projectUuid,
            metricQuery,
            explore,
            queryTags: {
                embed: 'true',
                external_id: account.user.id,
                project_uuid: projectUuid,
                organization_uuid: dashboard.organizationUuid,
                dashboard_uuid: dashboardUuid,
                explore_name: explore.name,
                query_context: QueryExecutionContext.FILTER_AUTOCOMPLETE,
            },
            account,
        });

        return {
            search,
            results: rows.map((row) => row[getItemId(field)]),
            refreshedAt: cacheMetadata.cacheUpdatedTime || new Date(),
            cached: cacheMetadata.cacheHit,
        };
    }
}
