import { Knex } from 'knex';

const TABLE_NAME = 'bratrax_ontology';

export async function up(knex: Knex): Promise<void> {
    if (!(await knex.schema.hasTable(TABLE_NAME))) {
        await knex.schema.createTable(TABLE_NAME, (table) => {
            table.increments('id').primary();
            table
                .uuid('project_uuid')
                .notNullable()
                .references('project_uuid')
                .inTable('projects')
                .onDelete('CASCADE');
            table
                .string('file_key', 50)
                .notNullable()
                .comment(
                    'config | ontology | sources | tracking_plan',
                );
            table.text('content').notNullable().comment('Raw YAML string');
            table
                .timestamp('updated_at', { useTz: true })
                .notNullable()
                .defaultTo(knex.fn.now());
            table.unique(['project_uuid', 'file_key']);
        });

        await knex.schema.alterTable(TABLE_NAME, (table) => {
            table.index(['project_uuid'], 'idx_bratrax_ontology_project');
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists(TABLE_NAME);
}
