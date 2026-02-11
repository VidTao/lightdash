import { CreateEmbedJwt, EmbedUrl, MissingConfigError } from '@lightdash/common';
import { Knex } from 'knex';
import { encodeLightdashJwt } from '../../auth/lightdashJwt';
import { LightdashConfig } from '../../config/parseConfig';
import { BaseService } from '../../services/BaseService';

type BratraxEmbedServiceDeps = {
    database: Knex;
    lightdashConfig: LightdashConfig;
};

export class BratraxEmbedService extends BaseService {
    private readonly database: Knex;

    private readonly lightdashConfig: LightdashConfig;

    constructor({ database, lightdashConfig }: BratraxEmbedServiceDeps) {
        super();
        this.database = database;
        this.lightdashConfig = lightdashConfig;
    }

    async getEmbedUrl(
        projectUuid: string,
        jwtData: CreateEmbedJwt,
        expiresIn: string = '1h',
    ): Promise<EmbedUrl> {
        const embedRow = await this.database('embedding')
            .select('encoded_secret')
            .where('project_uuid', projectUuid)
            .first();

        if (!embedRow) {
            throw new MissingConfigError(
                'Embedding is not configured for this project. An admin must set up embed credentials first.',
            );
        }

        const jwtToken = encodeLightdashJwt(
            jwtData,
            embedRow.encoded_secret,
            expiresIn,
        );

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
