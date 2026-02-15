/**
 * React Query hooks for Bratrax client CRUD operations.
 * Communicates via the Lightdash backend proxy at /api/v1/bratrax/clients/*.
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

export type ClientInfo = {
    name: string;
    has_config: boolean;
    has_ontology: boolean;
    has_sources: boolean;
    has_tracking_plan: boolean;
};

// ─── Hooks ───

export function useBratraxClients() {
    return useQuery({
        queryKey: ['bratrax-clients'],
        queryFn: () =>
            getJson<{ clients: ClientInfo[] }>(`${BRATRAX_API_BASE}/clients`),
    });
}

export function useBratraxCreateClient() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: { name: string; stack?: string }) =>
            postJson<{ name: string }>(`${BRATRAX_API_BASE}/clients`, input),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['bratrax-clients'],
            });
        },
    });
}

export function useBratraxSaveYaml() {
    return useMutation({
        mutationFn: (input: {
            clientName: string;
            fileKey: string;
            content: string;
        }) =>
            putJson<{ status: string }>(
                `${BRATRAX_API_BASE}/clients/${input.clientName}/${input.fileKey}`,
                { content: input.content },
            ),
    });
}

export function useBratraxValidateClient() {
    return useMutation({
        mutationFn: (name: string) =>
            postJson<unknown>(
                `${BRATRAX_API_BASE}/clients/${name}/validate`,
                {},
            ),
    });
}

export function useBratraxCompileClient() {
    return useMutation({
        mutationFn: (name: string) =>
            postJson<unknown>(
                `${BRATRAX_API_BASE}/clients/${name}/compile`,
                {},
            ),
    });
}
