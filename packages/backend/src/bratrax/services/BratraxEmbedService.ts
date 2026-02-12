import {
    type Account,
    AnonymousAccount,
    type ApiExecuteAsyncDashboardChartQueryResults,
    CreateEmbedJwt,
    type Dashboard,
    type DashboardAvailableFilters,
    type DashboardFilters,
    type DateGranularity,
    type DateZoom,
    EmbedContent,
    EmbedUrl,
    type ExecuteAsyncDashboardChartRequestParams,
    ForbiddenError,
    isChartContent,
    isDashboardChartTileType,
    isDashboardSlugContent,
    isDashboardUuidContent,
    type InteractivityOptions,
    NotFoundError,
    OssEmbed,
    type ParametersValuesMap,
    QueryExecutionContext,
    type SavedChartsInfoForDashboardAvailableFilters,
    type SortField,
    UserAccessControls,
    UserAttributeValueMap,
} from '@lightdash/common';
import { randomBytes } from 'crypto';
import { isArray } from 'lodash';
import { Knex } from 'knex';
import { fromJwt } from '../../auth/account';
import {
    decodeLightdashJwt,
    encodeLightdashJwt,
} from '../../auth/lightdashJwt';
import { LightdashConfig } from '../../config/parseConfig';
import Logger from '../../logging/logger';
import { DashboardModel } from '../../models/DashboardModel/DashboardModel';
import { BaseService } from '../../services/BaseService';
import { AsyncQueryService } from '../../services/AsyncQueryService/AsyncQueryService';
import { EncryptionUtil } from '../../utils/EncryptionUtil/EncryptionUtil';
import { wrapSentryTransaction } from '../../utils';

type BratraxEmbedServiceDeps = {
    database: Knex;
    lightdashConfig: LightdashConfig;
    dashboardModel: DashboardModel;
    asyncQueryService: AsyncQueryService;
};

export class BratraxEmbedService extends BaseService {
    private readonly database: Knex;

    private readonly lightdashConfig: LightdashConfig;

    private readonly encryptionUtil: EncryptionUtil;

    private readonly dashboardModel: DashboardModel;

    private readonly asyncQueryService: AsyncQueryService;

    constructor({
        database,
        lightdashConfig,
        dashboardModel,
        asyncQueryService,
    }: BratraxEmbedServiceDeps) {
        super();
        this.database = database;
        this.lightdashConfig = lightdashConfig;
        this.encryptionUtil = new EncryptionUtil({ lightdashConfig });
        this.dashboardModel = dashboardModel;
        this.asyncQueryService = asyncQueryService;
    }

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

        // Generate a random 32-byte secret and encrypt it
        const secret = randomBytes(32).toString('base64url');
        const encodedSecret = this.encryptionUtil.encrypt(secret);

        await this.database('embedding')
            .insert({
                project_uuid: projectUuid,
                encoded_secret: encodedSecret,
                dashboard_uuids: '{}',
                created_by: userUuid ?? null,
            })
            .onConflict('project_uuid')
            .merge();

        Logger.info(
            `Auto-provisioned embed config for project ${projectUuid}`,
        );

        // Re-read to handle the race case where another request inserted first
        const row = await this.database('embedding')
            .select('encoded_secret')
            .where('project_uuid', projectUuid)
            .first();

        return row!.encoded_secret;
    }

    /**
     * Reads the full embed config from the database, including org info.
     * Returns the OssEmbed shape expected by fromJwt().
     */
    private async getEmbedConfig(projectUuid: string): Promise<OssEmbed> {
        const row = await this.database('embedding')
            .select(
                'embedding.project_uuid',
                'embedding.encoded_secret',
                'embedding.dashboard_uuids',
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
            allowAllDashboards: row.allow_all_dashboards ?? false,
            chartUuids: row.chart_uuids ?? [],
            allowAllCharts: row.allow_all_charts ?? false,
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

    /**
     * Resolves the EmbedContent from a decoded JWT token.
     */
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

    /**
     * Builds user attribute access controls from the JWT and org defaults.
     */
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

    /**
     * Decodes a JWT embed token and returns an AnonymousAccount.
     * Called by jwtAuthMiddleware when the browser visits an embed URL.
     */
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

    // ─── Embed rendering methods ───────────────────────────────────────

    /**
     * Returns the dashboard with interactivity options extracted from the
     * JWT. Called by the embedController when the browser loads the embed page.
     */
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

        const dashboard = await this.dashboardModel.getByIdOrSlug(
            dashboardUuid,
        );

        // Extract interactivity options from the JWT content
        const jwtContent = account.authentication.data.content;
        const interactivityOptions: InteractivityOptions = {
            dashboardFiltersInteractivity:
                jwtContent.dashboardFiltersInteractivity,
            canExportCsv: jwtContent.canExportCsv,
            canExportImages: jwtContent.canExportImages,
            canExportPagePdf:
                'canExportPagePdf' in jwtContent
                    ? jwtContent.canExportPagePdf
                    : undefined,
            canDateZoom:
                'canDateZoom' in jwtContent
                    ? jwtContent.canDateZoom
                    : undefined,
            canExplore:
                'canExplore' in jwtContent
                    ? jwtContent.canExplore
                    : undefined,
            canViewUnderlyingData: jwtContent.canViewUnderlyingData,
            parameterInteractivity:
                'parameterInteractivity' in jwtContent
                    ? jwtContent.parameterInteractivity
                    : undefined,
        };

        // DashboardDAO is Omit<Dashboard, 'isPrivate' | 'access'> — fill
        // those fields for the response type.
        return {
            ...dashboard,
            isPrivate: null,
            access: null,
            ...interactivityOptions,
        } as Dashboard & InteractivityOptions;
    }

    /**
     * Executes an async query for a single dashboard tile.
     * Resolves the chart UUID from the tile and delegates to AsyncQueryService.
     */
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

        const dashboard = await this.dashboardModel.getByIdOrSlug(
            dashboardUuid,
        );

        // Find the tile and extract the chart UUID
        const tile = dashboard.tiles.find((t) => t.uuid === tileUuid);
        if (!tile || !isDashboardChartTileType(tile)) {
            throw new NotFoundError(
                `Chart tile ${tileUuid} not found in dashboard`,
            );
        }

        const chartUuid = tile.properties.savedChartUuid;
        if (!chartUuid) {
            throw new NotFoundError(
                `No saved chart associated with tile ${tileUuid}`,
            );
        }

        return this.asyncQueryService.executeAsyncDashboardChartQuery({
            account: account as Account,
            projectUuid,
            tileUuid,
            chartUuid,
            dashboardUuid,
            dashboardFilters: dashboardFilters ?? dashboard.filters,
            dashboardSorts: dashboardSorts ?? [],
            dateZoom,
            context: QueryExecutionContext.DASHBOARD,
            invalidateCache,
            parameters,
            pivotResults,
        });
    }

    /**
     * @deprecated Use executeAsyncDashboardTileQuery instead.
     * Kept for backward compatibility — the embed frontend may still call
     * the /chart-and-results endpoint.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getChartAndResults(
        _projectUuid: string,
        _account: AnonymousAccount,
        _tileUuid: string,
        _dashboardFilters?: DashboardFilters,
        _dateZoomGranularity?: DateGranularity,
        _dashboardSorts?: SortField[],
        _parameters?: ParametersValuesMap,
    ): Promise<never> {
        throw new ForbiddenError(
            'Deprecated embed endpoint not supported. Use async tile queries instead.',
        );
    }

    /**
     * Returns available dashboard filters. Stubbed to return empty filters
     * since we don't implement filter interactivity yet.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getAvailableFiltersForSavedQueries(
        _projectUuid: string,
        _account: AnonymousAccount,
        _body: SavedChartsInfoForDashboardAvailableFilters,
    ): Promise<DashboardAvailableFilters> {
        return {
            savedQueryFilters: {},
            allFilterableFields: [],
        };
    }

    // ─── Stubs for advanced embed features ─────────────────────────────
    // These are called by the embed controller but not needed for basic
    // dashboard rendering. They throw descriptive errors if invoked.

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async calculateTotalFromSavedChart(..._args: unknown[]): Promise<never> {
        throw new ForbiddenError(
            'Calculate totals is not supported in embed mode',
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async calculateSubtotalsFromSavedChart(
        ..._args: unknown[]
    ): Promise<never> {
        throw new ForbiddenError(
            'Calculate subtotals is not supported in embed mode',
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async calculateTotalFromQuery(..._args: unknown[]): Promise<never> {
        throw new ForbiddenError(
            'Calculate totals is not supported in embed mode',
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async calculateSubtotalsFromQuery(..._args: unknown[]): Promise<never> {
        throw new ForbiddenError(
            'Calculate subtotals is not supported in embed mode',
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async searchFilterValues(..._args: unknown[]): Promise<never> {
        throw new ForbiddenError(
            'Filter search is not supported in embed mode',
        );
    }
}
