import axios from 'axios';
import express, { type Router } from 'express';
import type { BratraxOntologyFileKey } from '../database/entities/bratraxOntology';
import {
    compileYaml,
    deployYaml,
    driftCheckYaml,
    getBratraxDiscoveryModel,
    getBratraxOntologyModel,
    getCatalogs,
    getGraph,
    getRawCatalogs,
    getStreamFields,
    getTapStreams,
    getTemplate,
    getWebhookDiscoveryStatus,
    introspectWebhookPayload,
    listTemplates,
    searchCatalogs,
    validateYaml,
} from '../helpers/bratrax-api';
import {
    buildCatalogMap,
    parseSingerCatalog,
    safeParseCatalogJson,
    searchParsedCatalogs,
    type CatalogEntry,
} from '../helpers/bratrax-catalog-parser';

export const bratraxRouter: Router = express.Router();

const VALID_FILE_KEYS = new Set([
    'config',
    'ontology',
    'sources',
    'tracking_plan',
]);

// ─── Health ───

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

// ─── Stateless compute (pass-through to Python API) ───

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

// ─── Catalogs (codebase constants) ───

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

// ─── Templates (codebase constants) ───

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

// ─── Project-Bound Ontology Routes (DB-backed) ───

bratraxRouter.get('/project-config/:projectUuid', async (req, res, next) => {
    try {
        const model = getBratraxOntologyModel(req.services);
        const bound = await model.exists(req.params.projectUuid);
        res.json({ status: 'ok', results: { bound } });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get('/ontology/:projectUuid', async (req, res, next) => {
    try {
        const model = getBratraxOntologyModel(req.services);
        const files = await model.getFiles(req.params.projectUuid);
        res.json({ status: 'ok', results: { files } });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.put('/ontology/:projectUuid/:fileKey', async (req, res, next) => {
    try {
        const { fileKey } = req.params;
        if (!VALID_FILE_KEYS.has(fileKey)) {
            res.status(400).json({
                status: 'error',
                results: {
                    message: `Invalid file_key "${fileKey}". Must be one of: ${[...VALID_FILE_KEYS].join(', ')}`,
                },
            });
            return;
        }

        const { content } = req.body;
        if (typeof content !== 'string') {
            res.status(400).json({
                status: 'error',
                results: { message: 'content must be a string' },
            });
            return;
        }

        const model = getBratraxOntologyModel(req.services);
        await model.upsertFile(
            req.params.projectUuid,
            fileKey as BratraxOntologyFileKey,
            content,
        );
        res.json({ status: 'ok', results: { saved: true } });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/ontology/:projectUuid/init', async (req, res, next) => {
    try {
        const { files } = req.body;
        if (!files || typeof files !== 'object') {
            res.status(400).json({
                status: 'error',
                results: { message: 'files object is required' },
            });
            return;
        }

        const model = getBratraxOntologyModel(req.services);
        await model.createFromTemplate(req.params.projectUuid, files);
        res.json({ status: 'ok', results: { initialized: true } });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post(
    '/ontology/:projectUuid/validate',
    async (req, res, next) => {
        try {
            const model = getBratraxOntologyModel(req.services);
            const files = await model.getFiles(req.params.projectUuid);
            const result = await validateYaml({
                config: files.config ?? '',
                ontology: files.ontology ?? '',
                sources: files.sources ?? '',
                tracking_plan: files.tracking_plan ?? '',
            });
            res.json({ status: 'ok', results: result });
        } catch (error) {
            next(error);
        }
    },
);

bratraxRouter.post('/ontology/:projectUuid/compile', async (req, res, next) => {
    try {
        const model = getBratraxOntologyModel(req.services);
        const files = await model.getFiles(req.params.projectUuid);
        const result = await compileYaml({
            config: files.config ?? '',
            ontology: files.ontology ?? '',
            sources: files.sources ?? '',
            tracking_plan: files.tracking_plan ?? '',
        });
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/ontology/:projectUuid/deploy', async (req, res, next) => {
    try {
        const model = getBratraxOntologyModel(req.services);
        const files = await model.getFiles(req.params.projectUuid);
        const result = await deployYaml({
            config: files.config ?? '',
            ontology: files.ontology ?? '',
            sources: files.sources ?? '',
            tracking_plan: files.tracking_plan ?? '',
            apply: req.body.apply ?? false,
        });
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/ontology/:projectUuid/drift', async (req, res, next) => {
    try {
        const model = getBratraxOntologyModel(req.services);
        const discoveryModel = getBratraxDiscoveryModel(req.services);
        const files = await model.getFiles(req.params.projectUuid);

        // Auto-seed global catalogs if DB is empty (same as GET /catalogs)
        const hasGlobal = await discoveryModel.globalCatalogsExist();
        if (!hasGlobal) {
            try {
                const rawCatalogs = await getRawCatalogs();
                await Promise.all(
                    Object.entries(rawCatalogs).map(
                        ([sourceKey, catalogJson]) => {
                            const sourceType = sourceKey.startsWith('webhook-')
                                ? 'webhook'
                                : 'meltano';
                            return discoveryModel.upsertGlobalCatalog(
                                sourceKey,
                                catalogJson,
                                sourceType as 'meltano' | 'webhook',
                            );
                        },
                    ),
                );
            } catch (seedError) {
                // Non-blocking: Python API may be offline
                const msg =
                    seedError instanceof Error
                        ? seedError.message
                        : String(seedError);
                console.warn(
                    `[bratrax] Auto-seed catalogs failed (drift): ${msg}`,
                );
            }
        }

        // Fetch DB catalogs — project-specific rows override global ones
        const catalogRows = await discoveryModel.getCatalogsForProject(
            req.params.projectUuid,
        );
        const catalogs = buildCatalogMap(catalogRows);

        const result = await driftCheckYaml({
            config: files.config ?? '',
            ontology: files.ontology ?? '',
            sources: files.sources ?? '',
            tracking_plan: files.tracking_plan ?? '',
            source: req.body.source,
            catalogs,
        });
        res.json({ status: 'ok', results: result });
    } catch (error) {
        next(error);
    }
});

// ─── Discovery Catalog Routes (DB-backed) ───

/**
 * Helper: parse all DB rows into CatalogEntry[].
 */
function parseCatalogRows(
    rows: Array<{ source_key: string; catalog_json: object }>,
): CatalogEntry[] {
    const entries: CatalogEntry[] = [];
    for (const row of rows) {
        const catalogJson = safeParseCatalogJson(row.catalog_json);
        if (catalogJson) {
            const entry = parseSingerCatalog(row.source_key, catalogJson);
            if (entry) {
                entries.push(entry);
            }
        }
    }
    return entries;
}

bratraxRouter.post('/sync-catalogs', async (req, res, next) => {
    try {
        const discoveryModel = getBratraxDiscoveryModel(req.services);
        const rawCatalogs = await getRawCatalogs();

        const sourceKeys: string[] = [];
        const upserts = Object.entries(rawCatalogs).map(
            ([sourceKey, catalogJson]) => {
                sourceKeys.push(sourceKey);
                const sourceType = sourceKey.startsWith('webhook-')
                    ? 'webhook'
                    : 'meltano';
                return discoveryModel.upsertGlobalCatalog(
                    sourceKey,
                    catalogJson,
                    sourceType as 'meltano' | 'webhook',
                );
            },
        );
        await Promise.all(upserts);

        res.json({
            status: 'ok',
            results: { synced: sourceKeys.length, sourceKeys },
        });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.post('/seed-catalogs', async (req, res, next) => {
    try {
        const discoveryModel = getBratraxDiscoveryModel(req.services);
        const rawCatalogs = await getRawCatalogs();

        const upserts = Object.entries(rawCatalogs).map(
            ([sourceKey, catalogJson]) => {
                const sourceType = sourceKey.startsWith('webhook-')
                    ? 'webhook'
                    : 'meltano';
                return discoveryModel.upsertGlobalCatalog(
                    sourceKey,
                    catalogJson,
                    sourceType as 'meltano' | 'webhook',
                );
            },
        );
        await Promise.all(upserts);

        res.json({
            status: 'ok',
            results: { seeded: upserts.length },
        });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get('/ontology/:projectUuid/catalogs', async (req, res, next) => {
    try {
        const discoveryModel = getBratraxDiscoveryModel(req.services);

        // Auto-seed global catalogs on first access
        const hasGlobal = await discoveryModel.globalCatalogsExist();
        if (!hasGlobal) {
            try {
                const rawCatalogs = await getRawCatalogs();
                const seedUpserts = Object.entries(rawCatalogs).map(
                    ([sourceKey, catalogJson]) => {
                        const sourceType = sourceKey.startsWith('webhook-')
                            ? 'webhook'
                            : 'meltano';
                        return discoveryModel.upsertGlobalCatalog(
                            sourceKey,
                            catalogJson,
                            sourceType as 'meltano' | 'webhook',
                        );
                    },
                );
                await Promise.all(seedUpserts);
            } catch (seedError) {
                // Python API may be offline — continue with empty
                const msg =
                    seedError instanceof Error
                        ? seedError.message
                        : String(seedError);
                console.warn(`[bratrax] Auto-seed catalogs failed: ${msg}`);
            }
        }

        const rows = await discoveryModel.getCatalogsForProject(
            req.params.projectUuid,
        );
        const catalogs = parseCatalogRows(rows);
        res.json({ status: 'ok', results: { catalogs } });
    } catch (error) {
        next(error);
    }
});

bratraxRouter.get(
    '/ontology/:projectUuid/catalogs/search',
    async (req, res, next) => {
        try {
            const discoveryModel = getBratraxDiscoveryModel(req.services);
            const rows = await discoveryModel.getCatalogsForProject(
                req.params.projectUuid,
            );
            const catalogs = parseCatalogRows(rows);

            const query = (req.query.q as string) ?? '';
            const typeFilter = req.query.type as string | undefined;
            const limit = req.query.limit ? Number(req.query.limit) : 20;

            const results = searchParsedCatalogs(
                catalogs,
                query,
                typeFilter,
                limit,
            );
            res.json({
                status: 'ok',
                results: { query, results, count: results.length },
            });
        } catch (error) {
            next(error);
        }
    },
);

bratraxRouter.get(
    '/ontology/:projectUuid/catalogs/:sourceKey/streams',
    async (req, res, next) => {
        try {
            const discoveryModel = getBratraxDiscoveryModel(req.services);
            const row = await discoveryModel.getCatalog(
                req.params.projectUuid,
                req.params.sourceKey,
            );

            if (!row) {
                res.status(404).json({
                    status: 'error',
                    results: {
                        message: `Source '${req.params.sourceKey}' not found`,
                    },
                });
                return;
            }

            const catalogJson = safeParseCatalogJson(row.catalog_json);
            const entry = catalogJson
                ? parseSingerCatalog(row.source_key, catalogJson)
                : null;
            if (!entry) {
                res.status(404).json({
                    status: 'error',
                    results: { message: 'No streams found' },
                });
                return;
            }

            res.json({
                status: 'ok',
                results: {
                    tap: entry.tap,
                    label: entry.label,
                    category: entry.category,
                    source_name: entry.source_name,
                    raw_table: entry.raw_table,
                    source_type: entry.source_type,
                    streams: entry.streams.map((s) => ({
                        name: s.name,
                        field_count: s.fields.length,
                        key_properties: s.key_properties,
                        replication_method: s.replication_method,
                    })),
                },
            });
        } catch (error) {
            next(error);
        }
    },
);

bratraxRouter.get(
    '/ontology/:projectUuid/catalogs/:sourceKey/streams/:stream',
    async (req, res, next) => {
        try {
            const discoveryModel = getBratraxDiscoveryModel(req.services);
            const row = await discoveryModel.getCatalog(
                req.params.projectUuid,
                req.params.sourceKey,
            );

            if (!row) {
                res.status(404).json({
                    status: 'error',
                    results: {
                        message: `Source '${req.params.sourceKey}' not found`,
                    },
                });
                return;
            }

            const catalogJson = safeParseCatalogJson(row.catalog_json);
            const entry = catalogJson
                ? parseSingerCatalog(row.source_key, catalogJson)
                : null;
            const stream = entry?.streams.find(
                (s) => s.name === req.params.stream,
            );

            if (!stream) {
                res.status(404).json({
                    status: 'error',
                    results: {
                        message: `Stream '${req.params.stream}' not found in '${req.params.sourceKey}'`,
                    },
                });
                return;
            }

            res.json({
                status: 'ok',
                results: {
                    tap: entry!.tap,
                    stream: stream.name,
                    source_name: entry!.source_name,
                    key_properties: stream.key_properties,
                    replication_method: stream.replication_method,
                    fields: stream.fields,
                },
            });
        } catch (error) {
            next(error);
        }
    },
);

bratraxRouter.get(
    '/ontology/:projectUuid/webhook-discovery-status/:source',
    async (req, res, next) => {
        try {
            const discoveryModel = getBratraxDiscoveryModel(req.services);
            const sourceKey = `webhook-${req.params.source}`;
            const row = await discoveryModel.getCatalog(
                req.params.projectUuid,
                sourceKey,
            );

            if (!row) {
                res.json({
                    status: 'ok',
                    results: {
                        source: req.params.source,
                        discovered: false,
                        streams: 0,
                        fields: 0,
                    },
                });
                return;
            }

            const catalogJson = safeParseCatalogJson(row.catalog_json);
            const entry = catalogJson
                ? parseSingerCatalog(sourceKey, catalogJson)
                : null;
            const totalFields =
                entry?.streams.reduce((sum, s) => sum + s.fields.length, 0) ??
                0;

            res.json({
                status: 'ok',
                results: {
                    source: req.params.source,
                    discovered: true,
                    streams: entry?.streams.length ?? 0,
                    fields: totalFields,
                    label: entry?.label ?? sourceKey,
                },
            });
        } catch (error) {
            next(error);
        }
    },
);

bratraxRouter.post(
    '/ontology/:projectUuid/introspect-webhook',
    async (req, res, next) => {
        try {
            const {
                source,
                stream,
                payload,
                key_properties: keyProperties,
            } = req.body;

            if (!source || !stream || !payload) {
                res.status(400).json({
                    status: 'error',
                    results: {
                        message: 'source, stream, and payload are required',
                    },
                });
                return;
            }

            const discoveryModel = getBratraxDiscoveryModel(req.services);
            const sourceKey = `webhook-${source}`;

            // Read existing catalog from DB (if any)
            const existingRow = await discoveryModel.getCatalog(
                req.params.projectUuid,
                sourceKey,
            );
            const existingCatalog = existingRow
                ? safeParseCatalogJson(existingRow.catalog_json)
                : null;

            // Stateless merge via Python API
            const result = await introspectWebhookPayload({
                source,
                stream,
                payload,
                key_properties: keyProperties,
                existing_catalog: existingCatalog,
            });

            // Upsert merged catalog into DB
            await discoveryModel.upsertProjectCatalog(
                req.params.projectUuid,
                sourceKey,
                result.catalog,
            );

            const entry = parseSingerCatalog(sourceKey, result.catalog);
            const totalFields =
                entry?.streams.reduce((sum, s) => sum + s.fields.length, 0) ??
                0;

            res.json({
                status: 'ok',
                results: {
                    source,
                    stream,
                    streams: entry?.streams.length ?? 0,
                    fields: totalFields,
                },
            });
        } catch (error) {
            next(error);
        }
    },
);
