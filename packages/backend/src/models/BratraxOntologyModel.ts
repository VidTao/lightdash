import { Knex } from 'knex';
import {
    BratraxOntologyTableName,
    type BratraxOntologyFileKey,
} from '../database/entities/bratraxOntology';

const VALID_FILE_KEYS: ReadonlySet<string> = new Set([
    'config',
    'ontology',
    'sources',
    'tracking_plan',
]);

export class BratraxOntologyModel {
    private database: Knex;

    constructor({ database }: { database: Knex }) {
        this.database = database;
    }

    async getFiles(
        projectUuid: string,
    ): Promise<Record<string, string>> {
        const rows = await this.database(BratraxOntologyTableName)
            .select('file_key', 'content')
            .where('project_uuid', projectUuid);

        const files: Record<string, string> = {};
        for (const row of rows) {
            files[row.file_key] = row.content;
        }
        return files;
    }

    async getFile(
        projectUuid: string,
        fileKey: BratraxOntologyFileKey,
    ): Promise<string | null> {
        const row = await this.database(BratraxOntologyTableName)
            .select('content')
            .where('project_uuid', projectUuid)
            .where('file_key', fileKey)
            .first();

        return row?.content ?? null;
    }

    async upsertFile(
        projectUuid: string,
        fileKey: BratraxOntologyFileKey,
        content: string,
    ): Promise<void> {
        if (!VALID_FILE_KEYS.has(fileKey)) {
            throw new Error(
                `Invalid file_key "${fileKey}". Must be one of: ${[...VALID_FILE_KEYS].join(', ')}`,
            );
        }

        const existing = await this.database(BratraxOntologyTableName)
            .select('id')
            .where('project_uuid', projectUuid)
            .where('file_key', fileKey)
            .first();

        if (existing) {
            await this.database(BratraxOntologyTableName)
                .where('project_uuid', projectUuid)
                .where('file_key', fileKey)
                .update({ content, updated_at: this.database.fn.now() });
        } else {
            await this.database(BratraxOntologyTableName).insert({
                project_uuid: projectUuid,
                file_key: fileKey,
                content,
            });
        }
    }

    async createFromTemplate(
        projectUuid: string,
        files: Record<string, string>,
    ): Promise<void> {
        await this.database.transaction(async (trx) => {
            await trx(BratraxOntologyTableName)
                .where('project_uuid', projectUuid)
                .del();

            const rows = Object.entries(files)
                .filter(([key]) => VALID_FILE_KEYS.has(key))
                .map(([fileKey, content]) => ({
                    project_uuid: projectUuid,
                    file_key: fileKey,
                    content,
                }));

            if (rows.length > 0) {
                await trx(BratraxOntologyTableName).insert(rows);
            }
        });
    }

    async exists(projectUuid: string): Promise<boolean> {
        const row = await this.database(BratraxOntologyTableName)
            .select(this.database.raw('1'))
            .where('project_uuid', projectUuid)
            .first();

        return !!row;
    }

    async deleteAll(projectUuid: string): Promise<void> {
        await this.database(BratraxOntologyTableName)
            .where('project_uuid', projectUuid)
            .del();
    }
}
