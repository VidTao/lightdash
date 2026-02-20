/**
 * React Query hooks for Bratrax ontology operations.
 * All data lives in the bratrax_ontology table, keyed by project_uuid.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const BRATRAX_API_BASE = '/api/v1/bratrax';

async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    const json = await response.json();
    return json.results;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error?.results?.message ??
                error?.message ??
                `Request failed: ${response.status}`,
        );
    }
    const json = await response.json();
    return json.results;
}

async function putJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error?.results?.message ??
                error?.message ??
                `Request failed: ${response.status}`,
        );
    }
    const json = await response.json();
    return json.results;
}

// ─── Types ───

export type BratraxProjectConfig = {
    bound: boolean;
};

// ─── Project Config ───

export function useBratraxProjectConfig(projectUuid: string | undefined) {
    return useQuery({
        queryKey: ['bratrax-project-config', projectUuid],
        queryFn: () =>
            getJson<BratraxProjectConfig>(
                `${BRATRAX_API_BASE}/project-config/${projectUuid}`,
            ),
        enabled: !!projectUuid,
    });
}

// ─── Init (setup wizard) ───

export function useBratraxInitOntology(projectUuid: string | undefined) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (files: Record<string, string>) =>
            postJson<{ initialized: boolean }>(
                `${BRATRAX_API_BASE}/ontology/${projectUuid}/init`,
                { files },
            ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['bratrax-project-config', projectUuid],
            });
            void queryClient.invalidateQueries({
                queryKey: ['bratrax-ontology', projectUuid],
            });
        },
    });
}

// ─── Ontology CRUD ───

export function useBratraxOntology(projectUuid: string | undefined) {
    return useQuery({
        queryKey: ['bratrax-ontology', projectUuid],
        queryFn: () =>
            getJson<{ files: Record<string, string> }>(
                `${BRATRAX_API_BASE}/ontology/${projectUuid}`,
            ),
        enabled: !!projectUuid,
    });
}

export function useBratraxSaveOntologyYaml(projectUuid: string | undefined) {
    return useMutation({
        mutationFn: (input: { fileKey: string; content: string }) =>
            putJson<{ saved: boolean }>(
                `${BRATRAX_API_BASE}/ontology/${projectUuid}/${input.fileKey}`,
                { content: input.content },
            ),
    });
}

// ─── Validate / Compile ───

export function useBratraxValidateOntology(projectUuid: string | undefined) {
    return useMutation({
        mutationFn: () =>
            postJson<unknown>(
                `${BRATRAX_API_BASE}/ontology/${projectUuid}/validate`,
                {},
            ),
    });
}

export function useBratraxCompileOntology(projectUuid: string | undefined) {
    return useMutation({
        mutationFn: () =>
            postJson<unknown>(
                `${BRATRAX_API_BASE}/ontology/${projectUuid}/compile`,
                {},
            ),
    });
}
