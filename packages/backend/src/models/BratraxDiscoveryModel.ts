import { Knex } from 'knex';
import {
    BratraxDiscoveryCatalogTableName,
    type BratraxDiscoveryCatalogSourceType,
    type CatalogSourceMetadata,
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
        // Order so global rows (project_uuid IS NULL) come first and
        // project-specific rows come last.  When buildCatalogMap() iterates,
        // the project rows overwrite the global ones for the same source_key.
        return this.database(BratraxDiscoveryCatalogTableName)
            .select('*')
            .where('project_uuid', projectUuid)
            .orWhereNull('project_uuid')
            .orderByRaw('project_uuid IS NULL DESC')
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
        metadata?: CatalogSourceMetadata,
    ): Promise<void> {
        const existing = await this.database(
            BratraxDiscoveryCatalogTableName,
        )
            .select('id')
            .whereNull('project_uuid')
            .where('source_key', sourceKey)
            .first();

        const metadataFields = metadata
            ? {
                  ...(metadata.source_label !== undefined
                      ? { source_label: metadata.source_label }
                      : {}),
                  ...(metadata.source_category !== undefined
                      ? { source_category: metadata.source_category }
                      : {}),
                  ...(metadata.raw_table_override !== undefined
                      ? { raw_table_override: metadata.raw_table_override }
                      : {}),
              }
            : {};

        if (existing) {
            await this.database(BratraxDiscoveryCatalogTableName)
                .where('id', existing.id)
                .update({
                    catalog_json: JSON.stringify(catalogJson),
                    source_type: sourceType,
                    updated_at: this.database.fn.now(),
                    ...metadataFields,
                });
        } else {
            await this.database(BratraxDiscoveryCatalogTableName).insert({
                project_uuid: null,
                source_key: sourceKey,
                catalog_json: JSON.stringify(catalogJson),
                source_type: sourceType,
                ...metadataFields,
            });
        }
    }

    async upsertProjectCatalog(
        projectUuid: string,
        sourceKey: string,
        catalogJson: object,
        sourceType: BratraxDiscoveryCatalogSourceType = 'webhook',
        metadata?: CatalogSourceMetadata,
    ): Promise<void> {
        const existing = await this.database(
            BratraxDiscoveryCatalogTableName,
        )
            .select('id')
            .where('project_uuid', projectUuid)
            .where('source_key', sourceKey)
            .first();

        const metadataFields = metadata
            ? {
                  ...(metadata.source_label !== undefined
                      ? { source_label: metadata.source_label }
                      : {}),
                  ...(metadata.source_category !== undefined
                      ? { source_category: metadata.source_category }
                      : {}),
                  ...(metadata.raw_table_override !== undefined
                      ? { raw_table_override: metadata.raw_table_override }
                      : {}),
              }
            : {};

        if (existing) {
            await this.database(BratraxDiscoveryCatalogTableName)
                .where('id', existing.id)
                .update({
                    catalog_json: JSON.stringify(catalogJson),
                    source_type: sourceType,
                    updated_at: this.database.fn.now(),
                    ...metadataFields,
                });
        } else {
            await this.database(BratraxDiscoveryCatalogTableName).insert({
                project_uuid: projectUuid,
                source_key: sourceKey,
                catalog_json: JSON.stringify(catalogJson),
                source_type: sourceType,
                ...metadataFields,
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

    async updateCatalogMetadata(
        projectUuid: string,
        sourceKey: string,
        metadata: CatalogSourceMetadata,
    ): Promise<boolean> {
        // Try project-specific row first, then fall back to global
        const row = await this.database(BratraxDiscoveryCatalogTableName)
            .select('id')
            .where('source_key', sourceKey)
            .where(function () {
                this.where('project_uuid', projectUuid).orWhereNull(
                    'project_uuid',
                );
            })
            .orderByRaw('project_uuid IS NOT NULL DESC')
            .first();

        if (!row) {
            return false;
        }

        const updateFields: Record<string, string | null> = {};
        if (metadata.source_label !== undefined) {
            updateFields.source_label = metadata.source_label ?? null;
        }
        if (metadata.source_category !== undefined) {
            updateFields.source_category = metadata.source_category ?? null;
        }
        if (metadata.raw_table_override !== undefined) {
            updateFields.raw_table_override =
                metadata.raw_table_override ?? null;
        }

        if (Object.keys(updateFields).length === 0) {
            return true;
        }

        await this.database(BratraxDiscoveryCatalogTableName)
            .where('id', row.id)
            .update({
                ...updateFields,
                updated_at: this.database.fn.now(),
            });

        return true;
    }
}
