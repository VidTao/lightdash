/**
 * Pure functions for computing field-level warnings and errors.
 * No React dependencies — used by useBuilderState and UI components.
 */
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
