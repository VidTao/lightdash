import { Knex } from 'knex';

export const BratraxDiscoveryCatalogTableName = 'bratrax_discovery_catalog';

export type BratraxDiscoveryCatalogSourceType = 'meltano' | 'webhook';

export type DbBratraxDiscoveryCatalog = {
    id: number;
    project_uuid: string | null;
    source_key: string;
    catalog_json: object;
    source_type: BratraxDiscoveryCatalogSourceType;
    source_label: string | null;
    source_category: string | null;
    raw_table_override: string | null;
    updated_at: Date;
};

export type CatalogSourceMetadata = {
    source_label?: string;
    source_category?: string;
    raw_table_override?: string;
};

export type CreateDbBratraxDiscoveryCatalog = Pick<
    DbBratraxDiscoveryCatalog,
    'project_uuid' | 'source_key' | 'catalog_json' | 'source_type'
> &
    Partial<
        Pick<
            DbBratraxDiscoveryCatalog,
            'source_label' | 'source_category' | 'raw_table_override'
        >
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
