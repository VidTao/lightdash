const axios = require('axios');

const BRATRAX_API_URL =
    process.env.BRATRAX_API_URL || 'http://localhost:8081';

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
