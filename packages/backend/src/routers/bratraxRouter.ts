import express, { type Router } from 'express';
import {
    compileYaml,
    getCatalogs,
    getGraph,
    getTemplate,
    listTemplates,
    validateYaml,
} from '../helpers/bratrax-api';

export const bratraxRouter: Router = express.Router();

bratraxRouter.get('/health', async (_req, res, next) => {
    try {
        const axios = require('axios');
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
