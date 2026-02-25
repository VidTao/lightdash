import { Knex } from 'knex';

const TABLE_NAME = 'bratrax_discovery_catalog';

export async function up(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable(TABLE_NAME)) {
        await knex.schema.alterTable(TABLE_NAME, (t) => {
            t.text('source_label')
                .nullable()
                .comment('Human-readable label, e.g. "Facebook Ads"');
            t.text('source_category')
                .nullable()
                .comment('Category: ads, commerce, crm, other');
            t.text('raw_table_override')
                .nullable()
                .comment(
                    'Override raw_table; falls back to SOURCE_REGISTRY or inference',
                );
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    if (await knex.schema.hasTable(TABLE_NAME)) {
        await knex.schema.alterTable(TABLE_NAME, (t) => {
            t.dropColumn('source_label');
            t.dropColumn('source_category');
            t.dropColumn('raw_table_override');
        });
    }
}
