import { Knex } from 'knex';

export const BratraxDiscoveryCatalogTableName = 'bratrax_discovery_catalog';

export type BratraxDiscoveryCatalogSourceType = 'meltano' | 'webhook';

export type DbBratraxDiscoveryCatalog = {
    id: number;
    project_uuid: string | null;
    source_key: string;
    catalog_json: object;
    source_type: BratraxDiscoveryCatalogSourceType;
    updated_at: Date;
};

export type CreateDbBratraxDiscoveryCatalog = Pick<
    DbBratraxDiscoveryCatalog,
    'project_uuid' | 'source_key' | 'catalog_json' | 'source_type'
>;

export type UpdateDbBratraxDiscoveryCatalog = Pick<
    DbBratraxDiscoveryCatalog,
    'catalog_json'
>;

export type BratraxDiscoveryCatalogTable = Knex.CompositeTableType<
    DbBratraxDiscoveryCatalog,
    CreateDbBratraxDiscoveryCatalog,
    UpdateDbBratraxDiscoveryCatalog
>;
