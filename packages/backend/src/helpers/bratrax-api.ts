import axios from 'axios';

const BRATRAX_API_URL = process.env.BRATRAX_API_URL || 'http://localhost:8081';

const COMPILER_API = `${BRATRAX_API_URL}/api/v1`;

/**
 * Get platform credential field for a user
 */
export const getPlatformCredentials = async (userId: string) => {
    try {
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
    } catch (error) {
        console.error('Error getting platform credential:', error);
        throw error;
    }
};

// ─── Compiler API helpers ───

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

export const getCatalogs = async () => {
    const response = await axios.get(`${COMPILER_API}/catalogs`, {
        timeout: 15000,
    });
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

// ─── Client CRUD helpers ───

export const listClients = async () => {
    const response = await axios.get(`${COMPILER_API}/clients`, {
        timeout: 10000,
    });
    return response.data;
};

export const createClient = async (name: string, stack?: string) => {
    const response = await axios.post(
        `${COMPILER_API}/clients`,
        { name, stack: stack || 'shopify-paid-media' },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
    );
    return response.data;
};

export const readClient = async (name: string) => {
    const response = await axios.get(`${COMPILER_API}/clients/${name}`, {
        timeout: 10000,
    });
    return response.data;
};

export const writeClientYaml = async (
    name: string,
    file: string,
    content: string,
) => {
    const response = await axios.put(
        `${COMPILER_API}/clients/${name}/${file}`,
        { content },
        { headers: { 'Content-Type': 'application/json' }, timeout: 15000 },
    );
    return response.data;
};

export const validateClient = async (name: string) => {
    const response = await axios.post(
        `${COMPILER_API}/clients/${name}/validate`,
        {},
        { headers: { 'Content-Type': 'application/json' }, timeout: 30000 },
    );
    return response.data;
};

export const compileClient = async (name: string) => {
    const response = await axios.post(
        `${COMPILER_API}/clients/${name}/compile`,
        {},
        { headers: { 'Content-Type': 'application/json' }, timeout: 60000 },
    );
    return response.data;
};

export const deployClient = async (name: string, apply: boolean) => {
    const response = await axios.post(
        `${COMPILER_API}/clients/${name}/deploy`,
        { apply },
        { headers: { 'Content-Type': 'application/json' }, timeout: 60000 },
    );
    return response.data;
};
