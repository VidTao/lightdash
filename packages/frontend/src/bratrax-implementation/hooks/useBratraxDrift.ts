/**
 * React Query mutation hook for running drift checks against the Bratrax API.
 */
import { useMutation } from '@tanstack/react-query';

const BRATRAX_API_BASE = '/api/v1/bratrax';

// ─── Types ───

export type DriftItem = {
    field: string;
    kind: 'missing' | 'type_mismatch' | 'polymorphic' | 'schema_less_array';
    severity: 'info' | 'warning' | 'error';
    message: string;
    declared_type: string;
    catalog_type: string;
};

export type ExclusionViolationItem = {
    field_a: string;
    field_b: string;
    behavior_a: string;
    behavior_b: string;
    message: string;
};

export type DriftStreamResult = {
    source: string;
    stream: string;
    coverage_pct: number;
    declared_fields: number;
    catalog_fields: number;
    drifts: DriftItem[];
    exclusion_violations: ExclusionViolationItem[];
};

export type DriftCheckResult = {
    client: string;
    source_filter: string | null;
    results: DriftStreamResult[];
    has_errors: boolean;
};

// ─── Hook ───

export function useBratraxOntologyDrift(projectUuid: string | undefined) {
    return useMutation({
        mutationFn: async (params?: {
            source?: string;
        }): Promise<DriftCheckResult> => {
            const response = await fetch(
                `${BRATRAX_API_BASE}/ontology/${projectUuid}/drift`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(params ?? {}),
                },
            );
            if (!response.ok) {
                throw new Error(`Drift check failed: ${response.status}`);
            }
            const json = await response.json();
            return json.results as DriftCheckResult;
        },
    });
}
