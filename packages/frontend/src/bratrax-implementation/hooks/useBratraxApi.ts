/**
 * React Query hooks for the Bratrax compiler API.
 * Communicates via the Lightdash backend proxy at /api/v1/bratrax/*.
 */
import { useMutation, useQuery } from '@tanstack/react-query';
import type { CompilerYamlPayload } from '../pages/WorkshopBuilder/types';

const BRATRAX_API_BASE = '/api/v1/bratrax';

async function postJson<T>(url: string, body: unknown): Promise<T> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
            error?.results?.issues?.[0]?.message ??
                error?.message ??
                `Request failed: ${response.status}`,
        );
    }
    const json = await response.json();
    return json.results;
}

async function getJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    const json = await response.json();
    return json.results;
}

// ─── Types ───

export type ValidationIssue = {
    severity: 'error' | 'warning';
    code: string;
    message: string;
    context: string;
};

export type ValidateResult = {
    valid: boolean;
    errors: number;
    warnings: number;
    resolved_refs: number;
    issues: ValidationIssue[];
};

export type CompileArtifact = {
    path: string;
    type: string;
    layer: string;
    content: string;
};

export type CompileResult = {
    success: boolean;
    artifacts: CompileArtifact[];
    errors?: ValidationIssue[];
    summary?: {
        flatten: number;
        activity_stream: number;
        dim: number;
        meltano: number;
        total: number;
    };
};

export type GraphResult = {
    nodes: Array<{
        id: string;
        kind: string;
        label: string;
        details: Record<string, unknown>;
    }>;
    edges: Array<{
        source: string;
        target: string;
    }>;
};

export type TemplateInfo = {
    name: string;
    display_name: string;
    description: string;
};

export type TemplateFiles = {
    name: string;
    files: Record<string, string>;
};

// ─── Hooks ───

export function useBratraxValidate() {
    return useMutation({
        mutationFn: (payload: CompilerYamlPayload) =>
            postJson<ValidateResult>(
                `${BRATRAX_API_BASE}/validate`,
                payload,
            ),
    });
}

export function useBratraxCompile() {
    return useMutation({
        mutationFn: (payload: CompilerYamlPayload) =>
            postJson<CompileResult>(
                `${BRATRAX_API_BASE}/compile`,
                payload,
            ),
    });
}

export function useBratraxGraph() {
    return useMutation({
        mutationFn: (payload: CompilerYamlPayload) =>
            postJson<GraphResult>(
                `${BRATRAX_API_BASE}/graph`,
                payload,
            ),
    });
}

export function useBratraxTemplates() {
    return useQuery({
        queryKey: ['bratrax-templates'],
        queryFn: () =>
            getJson<{ templates: TemplateInfo[] }>(
                `${BRATRAX_API_BASE}/templates`,
            ),
    });
}

export function useBratraxTemplate(name: string | null) {
    return useQuery({
        queryKey: ['bratrax-template', name],
        queryFn: () =>
            getJson<TemplateFiles>(
                `${BRATRAX_API_BASE}/templates/${name}`,
            ),
        enabled: !!name,
    });
}
