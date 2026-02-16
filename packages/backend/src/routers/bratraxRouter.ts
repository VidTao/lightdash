import axios from 'axios';
import express, { type Router } from 'express';
import {
    compileClient,
    compileYaml,
    createClient,
    deployClient,
    getCatalogs,
    getGraph,
    getStreamFields,
    getTapStreams,
    getTemplate,
    getWebhookDiscoveryStatus,
    listClients,
    listTemplates,
    readClient,
    searchCatalogs,
    validateClient,
    validateYaml,
    writeClientYaml,
} from '../helpers/bratrax-api';

export const bratraxRouter: Router = express.Router();

bratraxRouter.get('/health', async (_req, res, next) => {
    try {
        const BRATRAX_API_URL =
            process.env.BRATRAX_API_URL || 'http://localhost:8081';
        const response = await axios.get(`${BRATRAX_API_URL}/api/v1/health`);
        res.json({ status: 'ok', results: response.data });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/validate', async (req, res, next) => {
    try {
        const result = await validateYaml(req.body);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/compile', async (req, res, next) => {
    try {
        const result = await compileYaml(req.body);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/graph', async (req, res, next) => {
    try {
        const result = await getGraph(req.body);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get('/catalogs', async (_req, res, next) => {
    try {
        const result = await getCatalogs();
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get('/catalogs/search', async (req, res, next) => {
    try {
        const query = (req.query.q as string) || '';
        const type = req.query.type as string | undefined;
        const limit = req.query.limit ? Number(req.query.limit) : undefined;
        const result = await searchCatalogs(query, type, limit);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get('/catalogs/:tap/streams', async (req, res, next) => {
    try {
        const result = await getTapStreams(req.params.tap);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get('/catalogs/:tap/streams/:stream', async (req, res, next) => {
    try {
        const result = await getStreamFields(req.params.tap, req.params.stream);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get(
    '/webhooks/:source/discovery-status',
    async (req, res, next) => {
        try {
            const result = await getWebhookDiscoveryStatus(req.params.source);
            res.json({ status: 'ok', results: result });
        } catch (error) {
            next(error);
        }
    },
);

bratraxRouter.get('/templates', async (_req, res, next) => {
    try {
        const result = await listTemplates();
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get('/templates/:name', async (req, res, next) => {
    try {
        const result = await getTemplate(req.params.name);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

// ─── Client CRUD routes ───

bratraxRouter.get('/clients', async (_req, res, next) => {
    try {
        const result = await listClients();
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/clients', async (req, res, next) => {
    try {
        const result = await createClient(req.body.name, req.body.stack);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get('/clients/:name', async (req, res, next) => {
    try {
        const result = await readClient(req.params.name);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.put('/clients/:name/:fileKey', async (req, res, next) => {
    try {
        const result = await writeClientYaml(
            req.params.name,
            req.params.fileKey,
            req.body.content,
        );
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/clients/:name/validate', async (req, res, next) => {
    try {
        const result = await validateClient(req.params.name);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/clients/:name/compile', async (req, res, next) => {
    try {
        const result = await compileClient(req.params.name);
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/clients/:name/deploy', async (req, res, next) => {
    try {
        const result = await deployClient(
            req.params.name,
            req.body.apply ?? false,
        );
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});
