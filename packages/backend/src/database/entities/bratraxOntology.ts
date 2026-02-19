import { Knex } from 'knex';

export const BratraxOntologyTableName = 'bratrax_ontology';

export type BratraxOntologyFileKey =
    | 'config'
    | 'ontology'
    | 'sources'
    | 'tracking_plan';

export type DbBratraxOntology = {
    id: number;
    project_uuid: string;
    file_key: BratraxOntologyFileKey;
    content: string;
    updated_at: Date;
};

export type CreateDbBratraxOntology = Pick<
    DbBratraxOntology,
    'project_uuid' | 'file_key' | 'content'
>;

export type UpdateDbBratraxOntology = Pick<DbBratraxOntology, 'content'>;

export type BratraxOntologyTable = Knex.CompositeTableType<
    DbBratraxOntology,
    CreateDbBratraxOntology,
    UpdateDbBratraxOntology
>;
