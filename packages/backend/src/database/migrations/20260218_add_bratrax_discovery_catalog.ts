import { Knex } from 'knex';

const TABLE_NAME = 'bratrax_discovery_catalog';

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(TABLE_NAME))) {
        await knex.schema.createTable(TABLE_NAME, (table) => {
            table.increments('id').primary();
            table
                .uuid('project_uuid')
                .nullable()
                .references('project_uuid')
                .inTable('projects')
                .onDelete('CASCADE')
                .comment('NULL = global tap catalog');
            table
                .string('source_key', 100)
                .notNullable()
                .comment('e.g. tap-shopify, webhook-leadbyte');
            table
                .jsonb('catalog_json')
                .notNullable()
                .comment('Singer catalog: {"streams": [...]}');
            table
                .string('source_type', 20)
                .notNullable()
                .defaultTo('meltano')
                .comment('meltano | webhook');
            table
                .timestamp('updated_at', { useTz: true })
                .notNullable()
                .defaultTo(knex.fn.now());
            table.unique(['project_uuid', 'source_key']);
        });

        await knex.schema.alterTable(TABLE_NAME, (table) => {
            table.index(
                ['project_uuid'],
                'idx_bratrax_discovery_project',
            );
        });

        // Partial unique index for global entries (NULL project_uuid)
        await knex.raw(
            `CREATE UNIQUE INDEX idx_bratrax_discovery_global_unique
             ON ${TABLE_NAME} (source_key) WHERE project_uuid IS NULL`,
        );
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists(TABLE_NAME);
}
