import { CreateEmbedJwt, EmbedUrl } from '@lightdash/common';
import { randomBytes } from 'crypto';
import { Knex } from 'knex';
import { encodeLightdashJwt } from '../../auth/lightdashJwt';
import { LightdashConfig } from '../../config/parseConfig';
import Logger from '../../logging/logger';
import { BaseService } from '../../services/BaseService';
import { EncryptionUtil } from '../../utils/EncryptionUtil/EncryptionUtil';

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
