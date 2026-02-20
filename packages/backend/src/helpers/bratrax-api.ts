import axios from 'axios';
import type { BratraxOntologyModel } from '../models/BratraxOntologyModel';
import type { ModelRepository } from '../models/ModelRepository';
import type { ServiceRepository } from '../services/ServiceRepository';

const BRATRAX_API_URL = process.env.BRATRAX_API_URL || 'http://localhost:8081';

const COMPILER_API = `${BRATRAX_API_URL}/api/v1`;

// ─── Model access helper ───

export function getBratraxOntologyModel(
    services: ServiceRepository,
): BratraxOntologyModel {
    const { models } = services as unknown as { models: ModelRepository };
    return models.getBratraxOntologyModel();
}

// ─── Compiler API helpers (stateless compute) ───

type CompilerYamlPayload = {
    config: string;
    ontology: string;
    sources: string;
    tracking_plan: string;
};

export const validateYaml = async (payload: CompilerYamlPayload) => {
    const response = await axios.post(`${COMPILER_API}/validate`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });
    return response.data;
};

export const compileYaml = async (payload: CompilerYamlPayload) => {
    const response = await axios.post(`${COMPILER_API}/compile`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
    });
    return response.data;
};

export const getGraph = async (payload: CompilerYamlPayload) => {
    const response = await axios.post(`${COMPILER_API}/graph`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });
    return response.data;
};

export const deployYaml = async (
    payload: CompilerYamlPayload & { apply?: boolean },
) => {
    const response = await axios.post(
        `${COMPILER_API}/deploy-payload`,
        payload,
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000,
        },
    );
    return response.data;
};

export const driftCheckYaml = async (
    payload: CompilerYamlPayload & {
        source?: string;
        catalogs?: Record<string, object>;
    },
) => {
    const response = await axios.post(
        `${COMPILER_API}/drift/check-payload`,
        payload,
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
        },
    );
    return response.data;
};

// ─── Model access helpers ───

export function getBratraxDiscoveryModel(services: ServiceRepository) {
    const { models } = services as unknown as { models: ModelRepository };
    return models.getBratraxDiscoveryModel();
}

// ─── Catalog helpers (codebase constants, not client data) ───

export const getCatalogs = async () => {
    const response = await axios.get(`${COMPILER_API}/catalogs`, {
        timeout: 15000,
    });
    return response.data;
};

export const getRawCatalogs = async (): Promise<Record<string, object>> => {
    const response = await axios.get(`${COMPILER_API}/catalogs/raw`, {
        timeout: 30000,
    });
    const data = response.data as { catalogs: Record<string, object> };
    return data.catalogs;
};

export const introspectWebhookPayload = async (payload: {
    source: string;
    stream: string;
    payload: object;
    key_properties?: string[];
    existing_catalog?: object | null;
}) => {
    const response = await axios.post(
        `${COMPILER_API}/catalogs/introspect-payload`,
        payload,
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
        },
    );
    return response.data;
};

export const getTapStreams = async (tap: string) => {
    const response = await axios.get(
        `${COMPILER_API}/catalogs/${encodeURIComponent(tap)}/streams`,
        { timeout: 10000 },
    );
    return response.data;
};

export const getStreamFields = async (tap: string, stream: string) => {
    const response = await axios.get(
        `${COMPILER_API}/catalogs/${encodeURIComponent(tap)}/streams/${encodeURIComponent(stream)}`,
        { timeout: 10000 },
    );
    return response.data;
};

export const getWebhookDiscoveryStatus = async (source: string) => {
    const response = await axios.get(
        `${COMPILER_API}/webhooks/${encodeURIComponent(source)}/discovery-status`,
        { timeout: 10000 },
    );
    return response.data;
};

export const searchCatalogs = async (
    query: string,
    type?: string,
    limit?: number,
) => {
    const params = new URLSearchParams({ q: query });
    if (type) params.set('type', type);
    if (limit) params.set('limit', String(limit));
    const response = await axios.get(
        `${COMPILER_API}/catalogs/search?${params.toString()}`,
        { timeout: 10000 },
    );
    return response.data;
};

// ─── Template helpers (codebase constants) ───

export const listTemplates = async () => {
    const response = await axios.get(`${COMPILER_API}/templates`, {
        timeout: 10000,
    });
    return response.data;
};

export const getTemplate = async (name: string) => {
    const response = await axios.get(`${COMPILER_API}/templates/${name}`, {
        timeout: 10000,
    });
    return response.data;
};

// ─── Platform credentials ───

export const getPlatformCredentials = async (userId: string) => {
    const response = await axios.get(
        `${BRATRAX_API_URL}/connectors/platform-credentials`,
        {
            headers: {
                'user-id': userId,
                'Content-Type': 'application/json',
            },
        },
    );
    return response.data;
};
