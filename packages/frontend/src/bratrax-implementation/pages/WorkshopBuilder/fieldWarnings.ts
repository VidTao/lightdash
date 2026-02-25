/**
 * Pure functions for computing field-level warnings and errors.
 * No React dependencies — used by useBuilderState and UI components.
 */
import type { CatalogEntry } from '../../hooks/useBratraxCatalogs';
import type { SourceField } from './types';

export type FieldWarning = {
    fieldName: string;
    severity: 'warning' | 'error';
    message: string;
    kind: 'polymorphic' | 'schema_less_array' | 'exclusion_conflict';
};

/**
 * Compute warnings for polymorphic and schema-less-array fields.
 */
export function computeFieldWarnings(fields: SourceField[]): FieldWarning[] {
    const warnings: FieldWarning[] = [];

    for (const field of fields) {
        if (field.polymorphic) {
            warnings.push({
                fieldName: field.name,
                severity: 'warning',
                message: `"${field.name}" has polymorphic types — may return NULL for object values`,
                kind: 'polymorphic',
            });
        }
        if (field.schema_less_array) {
            warnings.push({
                fieldName: field.name,
                severity: 'warning',
                message: `"${field.name}" is a schema-less array — sub-fields must be manually declared`,
                kind: 'schema_less_array',
            });
        }
    }

    return warnings;
}

/**
 * Compute pairwise exclusion conflicts among selected fields.
 * Returns one error per conflicting pair.
 */
export function computeExclusionConflicts(
    selectedFields: SourceField[],
): FieldWarning[] {
    const errors: FieldWarning[] = [];
    const checkedPairs = new Set<string>();

    for (const fieldA of selectedFields) {
        if (!fieldA.field_exclusions?.length) continue;
        const excludedSet = new Set(fieldA.field_exclusions);

        for (const fieldB of selectedFields) {
            if (fieldA.name === fieldB.name) continue;

            const pairKey = [fieldA.name, fieldB.name].sort().join('|');
            if (checkedPairs.has(pairKey)) continue;
            checkedPairs.add(pairKey);

            if (excludedSet.has(fieldB.name)) {
                const labelA = fieldA.behavior ?? 'ATTRIBUTE';
                const labelB = fieldB.behavior ?? 'ATTRIBUTE';
                errors.push({
                    fieldName: fieldA.name,
                    severity: 'error',
                    message: `"${fieldA.name}" (${labelA}) cannot be combined with "${fieldB.name}" (${labelB}) in the same API call`,
                    kind: 'exclusion_conflict',
                });
            }
        }
    }

    return errors;
}

// ─── Field Ref Validation (ontology refs vs. catalog) ───

export type FieldRef = {
    ref: string;
    source: string;
    stream: string;
    field: string;
};

export type FieldRefWarning = {
    ref: string;
    warning: string;
};

/**
 * Extract all $sources.X.Y.Z references from an ontology YAML string.
 * Returns structured refs that can be validated against loaded catalogs.
 */
export function collectParsedFieldRefs(ontologyYaml: string): FieldRef[] {
    const refs: FieldRef[] = [];
    const refRegex = /\$sources\.([^.\s,}]+)\.([^.\s,}]+)\.([^\s,}]+)/g;
    let match: RegExpExecArray | null;
    while ((match = refRegex.exec(ontologyYaml)) !== null) {
        refs.push({
            ref: match[0],
            source: match[1],
            stream: match[2],
            field: match[3],
        });
    }
    return refs;
}

/**
 * Validate parsed field refs against real catalog data.
 * Returns warnings for any source, stream, or field that cannot be resolved.
 */
export function validateFieldRefs(
    refs: FieldRef[],
    catalogs: CatalogEntry[],
): FieldRefWarning[] {
    const warnings: FieldRefWarning[] = [];
    const seen = new Set<string>();

    for (const ref of refs) {
        // Deduplicate — same ref can appear in multiple properties
        if (seen.has(ref.ref)) continue;
        seen.add(ref.ref);

        const catalog = catalogs.find(
            (c) => c.source_name === ref.source || c.tap === ref.source,
        );
        if (!catalog) {
            warnings.push({
                ref: ref.ref,
                warning: `Source "${ref.source}" not found in catalogs`,
            });
            continue;
        }

        const stream = catalog.streams.find((s) => s.name === ref.stream);
        if (!stream) {
            warnings.push({
                ref: ref.ref,
                warning: `Stream "${ref.stream}" not found in source "${ref.source}"`,
            });
            continue;
        }

        const field = stream.fields.find((f) => f.name === ref.field);
        if (!field) {
            warnings.push({
                ref: ref.ref,
                warning: `Field "${ref.field}" not found in ${ref.source}.${ref.stream}`,
            });
        }
    }

    return warnings;
}
