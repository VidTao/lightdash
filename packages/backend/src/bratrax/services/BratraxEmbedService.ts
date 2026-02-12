import {
    AnonymousAccount,
    CreateEmbedJwt,
    EmbedContent,
    EmbedUrl,
    isChartContent,
    isDashboardSlugContent,
    isDashboardUuidContent,
    NotFoundError,
    OssEmbed,
    UserAccessControls,
    UserAttributeValueMap,
} from '@lightdash/common';
import { randomBytes } from 'crypto';
import { isArray } from 'lodash';
import { Knex } from 'knex';
import { fromJwt } from '../../auth/account';
import { decodeLightdashJwt, encodeLightdashJwt } from '../../auth/lightdashJwt';
import { LightdashConfig } from '../../config/parseConfig';
import Logger from '../../logging/logger';
import { BaseService } from '../../services/BaseService';
import { EncryptionUtil } from '../../utils/EncryptionUtil/EncryptionUtil';
import { wrapSentryTransaction } from '../../utils';

type BratraxEmbedServiceDeps = {
    database: Knex;
    lightdashConfig: LightdashConfig;
};

export class BratraxEmbedService extends BaseService {
    private readonly database: Knex;

    private readonly lightdashConfig: LightdashConfig;

    private readonly encryptionUtil: EncryptionUtil;

    constructor({ database, lightdashConfig }: BratraxEmbedServiceDeps) {
        super();
        this.database = database;
        this.lightdashConfig = lightdashConfig;
        this.encryptionUtil = new EncryptionUtil({ lightdashConfig });
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
}
