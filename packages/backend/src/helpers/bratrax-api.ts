import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { BratraxOntologyModel } from '../models/BratraxOntologyModel';
import type { ModelRepository } from '../models/ModelRepository';
import type { ServiceRepository } from '../services/ServiceRepository';

const BRATRAX_API_URL = process.env.BRATRAX_API_URL || 'http://localhost:8081';

// ─── Dedicated axios instance with retry logic ───

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // exponential backoff

interface RetryableConfig extends InternalAxiosRequestConfig {
    __retryCount?: number;
}

const bratraxClient = axios.create({
    baseURL: `${BRATRAX_API_URL}/api/v1`,
    timeout: 30000,
});

bratraxClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const config = error.config as RetryableConfig | undefined;
        if (!config) return Promise.reject(error);

        const retryCount = config.__retryCount || 0;

        // Only retry on network errors or 5xx status codes
        const shouldRetry =
            !error.response ||
            (error.response.status >= 500 && error.response.status < 600);

        if (shouldRetry && retryCount < MAX_RETRIES) {
            config.__retryCount = retryCount + 1;
            const delay =
                RETRY_DELAYS[retryCount] ||
                RETRY_DELAYS[RETRY_DELAYS.length - 1];
            await new Promise((resolve) => {
                setTimeout(resolve, delay);
            });
            return bratraxClient(config);
        }

        return Promise.reject(error);
    },
);

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

export const validateYaml = async (
    payload: CompilerYamlPayload & { catalogs?: Record<string, object> },
) => {
    const response = await bratraxClient.post('/validate', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });
    return response.data;
};

export const compileYaml = async (
    payload: CompilerYamlPayload & { catalogs?: Record<string, object> },
) => {
    const response = await bratraxClient.post('/compile', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
    });
    return response.data;
};

export const getGraph = async (payload: CompilerYamlPayload) => {
    const response = await bratraxClient.post('/graph', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
    });
    return response.data;
};

export const deployYaml = async (
    payload: CompilerYamlPayload & { apply?: boolean },
) => {
    const response = await bratraxClient.post('/deploy-payload', payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60000,
    });
    return response.data;
};

export const driftCheckYaml = async (
    payload: CompilerYamlPayload & {
        source?: string;
        catalogs?: Record<string, object>;
    },
) => {
    const response = await bratraxClient.post(
        '/drift/check-payload',
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
    const response = await bratraxClient.get('/catalogs', {
        timeout: 15000,
    });
    return response.data;
};

export const getRawCatalogs = async (): Promise<Record<string, object>> => {
    const response = await bratraxClient.get('/catalogs/raw', {
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
    const response = await bratraxClient.post(
        '/catalogs/introspect-payload',
        payload,
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
        },
    );
    return response.data;
};

export const getTapStreams = async (tap: string) => {
    const response = await bratraxClient.get(
        `/catalogs/${encodeURIComponent(tap)}/streams`,
        { timeout: 10000 },
    );
    return response.data;
};

export const getStreamFields = async (tap: string, stream: string) => {
    const response = await bratraxClient.get(
        `/catalogs/${encodeURIComponent(tap)}/streams/${encodeURIComponent(stream)}`,
        { timeout: 10000 },
    );
    return response.data;
};

export const getWebhookDiscoveryStatus = async (source: string) => {
    const response = await bratraxClient.get(
        `/webhooks/${encodeURIComponent(source)}/discovery-status`,
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
    const response = await bratraxClient.get(
        `/catalogs/search?${params.toString()}`,
        { timeout: 10000 },
    );
    return response.data;
};

// ─── Template helpers (codebase constants) ───

export const listTemplates = async () => {
    const response = await bratraxClient.get('/templates', {
        timeout: 10000,
    });
    return response.data;
};

export const getTemplate = async (name: string) => {
    const response = await bratraxClient.get(
        `/templates/${encodeURIComponent(name)}`,
        { timeout: 10000 },
    );
    return response.data;
};

// ─── Platform credentials ───

// Platform credentials endpoint lives outside /api/v1, so use a full URL
export const getPlatformCredentials = async (userId: string) => {
    const response = await bratraxClient.get(
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
