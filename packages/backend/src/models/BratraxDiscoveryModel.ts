import { Knex } from 'knex';
import {
    BratraxDiscoveryCatalogTableName,
    type BratraxDiscoveryCatalogSourceType,
    type DbBratraxDiscoveryCatalog,
} from '../database/entities/bratraxDiscoveryCatalog';

export class BratraxDiscoveryModel {
    private database: Knex;

    constructor({ database }: { database: Knex }) {
        this.database = database;
    }

    async getCatalogsForProject(
        projectUuid: string,
    ): Promise<DbBratraxDiscoveryCatalog[]> {
        return this.database(BratraxDiscoveryCatalogTableName)
            .select('*')
            .where('project_uuid', projectUuid)
            .orWhereNull('project_uuid')
            .orderBy('source_key');
    }

    async getGlobalCatalogs(): Promise<DbBratraxDiscoveryCatalog[]> {
        return this.database(BratraxDiscoveryCatalogTableName)
            .select('*')
            .whereNull('project_uuid')
            .orderBy('source_key');
    }

    async getCatalog(
        projectUuid: string | null,
        sourceKey: string,
    ): Promise<DbBratraxDiscoveryCatalog | undefined> {
        const query = this.database(BratraxDiscoveryCatalogTableName)
            .select('*')
            .where('source_key', sourceKey);

        if (projectUuid === null) {
            query.whereNull('project_uuid');
        } else {
            query.where(function () {
                this.where('project_uuid', projectUuid).orWhereNull(
                    'project_uuid',
                );
            });
        }

        return query.first();
    }

    async upsertGlobalCatalog(
        sourceKey: string,
        catalogJson: object,
        sourceType: BratraxDiscoveryCatalogSourceType = 'meltano',
    ): Promise<void> {
        const existing = await this.database(
            BratraxDiscoveryCatalogTableName,
        )
            .select('id')
            .whereNull('project_uuid')
            .where('source_key', sourceKey)
            .first();

        if (existing) {
            await this.database(BratraxDiscoveryCatalogTableName)
                .where('id', existing.id)
                .update({
                    catalog_json: JSON.stringify(catalogJson),
                    source_type: sourceType,
                    updated_at: this.database.fn.now(),
                });
        } else {
            await this.database(BratraxDiscoveryCatalogTableName).insert({
                project_uuid: null,
                source_key: sourceKey,
                catalog_json: JSON.stringify(catalogJson),
                source_type: sourceType,
            });
        }
    }

    async upsertProjectCatalog(
        projectUuid: string,
        sourceKey: string,
        catalogJson: object,
    ): Promise<void> {
        const existing = await this.database(
            BratraxDiscoveryCatalogTableName,
        )
            .select('id')
            .where('project_uuid', projectUuid)
            .where('source_key', sourceKey)
            .first();

        if (existing) {
            await this.database(BratraxDiscoveryCatalogTableName)
                .where('id', existing.id)
                .update({
                    catalog_json: JSON.stringify(catalogJson),
                    updated_at: this.database.fn.now(),
                });
        } else {
            await this.database(BratraxDiscoveryCatalogTableName).insert({
                project_uuid: projectUuid,
                source_key: sourceKey,
                catalog_json: JSON.stringify(catalogJson),
                source_type: 'webhook',
            });
        }
    }

    async globalCatalogsExist(): Promise<boolean> {
        const row = await this.database(BratraxDiscoveryCatalogTableName)
            .select(this.database.raw('1'))
            .whereNull('project_uuid')
            .first();

        return !!row;
    }

    async deleteProjectCatalogs(projectUuid: string): Promise<void> {
        await this.database(BratraxDiscoveryCatalogTableName)
            .where('project_uuid', projectUuid)
            .del();
    }
}
