/**
 * Tests for bratrax-api.ts HTTP client helpers.
 *
 * bratrax-api.ts runs top-level code at import time (axios.create, env check),
 * so we use jest.isolateModules to re-import with fresh env per test group.
 */

const mockPost = jest.fn().mockResolvedValue({ data: { ok: true } });
const mockGet = jest.fn().mockResolvedValue({ data: { ok: true } });
const mockInterceptorUse = jest.fn();

jest.mock('axios', () => ({
    __esModule: true,
    default: {
        create: jest.fn(() => ({
            post: mockPost,
            get: mockGet,
            interceptors: {
                response: { use: mockInterceptorUse },
                request: { use: jest.fn() },
            },
        })),
    },
}));

describe('bratrax-api', () => {
    const originalEnv = { ...process.env };

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
        // Ensure we're not in production mode by default
        process.env.NODE_ENV = 'test';
        process.env.BRATRAX_API_URL = 'http://test-bratrax:8081';
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    // ── Environment variable validation ──────────────────────────────

    describe('BRATRAX_API_URL validation', () => {
        test('throws in production if BRATRAX_API_URL is not set', () => {
            process.env.NODE_ENV = 'production';
            delete process.env.BRATRAX_API_URL;
            expect(() => {
                jest.isolateModules(() => {
                    require('../bratrax-api');
                });
            }).toThrow('BRATRAX_API_URL must be set in production');
        });

        test('does not throw in development if BRATRAX_API_URL is not set', () => {
            process.env.NODE_ENV = 'development';
            delete process.env.BRATRAX_API_URL;
            expect(() => {
                jest.isolateModules(() => {
                    require('../bratrax-api');
                });
            }).not.toThrow();
        });

        test('does not throw in production if BRATRAX_API_URL is set', () => {
            process.env.NODE_ENV = 'production';
            process.env.BRATRAX_API_URL = 'https://api.example.com';
            expect(() => {
                jest.isolateModules(() => {
                    require('../bratrax-api');
                });
            }).not.toThrow();
        });
    });

    // ── API endpoint functions ───────────────────────────────────────

    describe('API helper functions', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let api: any;

        beforeEach(() => {
            jest.isolateModules(() => {
                api = require('../bratrax-api');
            });
        });

        test('validateYaml POSTs to /validate', async () => {
            const payload = {
                config: 'name: test',
                ontology: 'objects: {}',
                sources: 'sources: {}',
                tracking_plan: 'events: {}',
            };
            await api.validateYaml(payload);
            expect(mockPost).toHaveBeenCalledWith(
                '/validate',
                payload,
                expect.objectContaining({
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 30000,
                }),
            );
        });

        test('compileYaml POSTs to /compile with 60s timeout', async () => {
            const payload = {
                config: 'name: test',
                ontology: 'objects: {}',
                sources: 'sources: {}',
                tracking_plan: 'events: {}',
            };
            await api.compileYaml(payload);
            expect(mockPost).toHaveBeenCalledWith(
                '/compile',
                payload,
                expect.objectContaining({ timeout: 60000 }),
            );
        });

        test('getGraph POSTs to /graph', async () => {
            const payload = {
                config: 'name: test',
                ontology: 'objects: {}',
                sources: 'sources: {}',
                tracking_plan: 'events: {}',
            };
            await api.getGraph(payload);
            expect(mockPost).toHaveBeenCalledWith(
                '/graph',
                payload,
                expect.objectContaining({ timeout: 30000 }),
            );
        });

        test('deployYaml POSTs to /deploy-payload', async () => {
            const payload = {
                config: 'name: test',
                ontology: 'objects: {}',
                sources: 'sources: {}',
                tracking_plan: 'events: {}',
                apply: true,
            };
            await api.deployYaml(payload);
            expect(mockPost).toHaveBeenCalledWith(
                '/deploy-payload',
                payload,
                expect.objectContaining({ timeout: 60000 }),
            );
        });

        test('driftCheckYaml POSTs to /drift/check-payload', async () => {
            const payload = {
                config: 'name: test',
                ontology: 'objects: {}',
                sources: 'sources: {}',
                tracking_plan: 'events: {}',
                source: 'shopify',
            };
            await api.driftCheckYaml(payload);
            expect(mockPost).toHaveBeenCalledWith(
                '/drift/check-payload',
                payload,
                expect.objectContaining({ timeout: 30000 }),
            );
        });

        test('getCatalogs GETs /catalogs', async () => {
            await api.getCatalogs();
            expect(mockGet).toHaveBeenCalledWith(
                '/catalogs',
                expect.objectContaining({ timeout: 15000 }),
            );
        });

        test('getRawCatalogs GETs /catalogs/raw', async () => {
            mockGet.mockResolvedValueOnce({
                data: { catalogs: { shopify: {} } },
            });
            const result = await api.getRawCatalogs();
            expect(mockGet).toHaveBeenCalledWith(
                '/catalogs/raw',
                expect.objectContaining({ timeout: 30000 }),
            );
            expect(result).toEqual({ shopify: {} });
        });

        test('getTapStreams encodes tap name in URL', async () => {
            await api.getTapStreams('tap-shopify');
            expect(mockGet).toHaveBeenCalledWith(
                '/catalogs/tap-shopify/streams',
                expect.objectContaining({ timeout: 10000 }),
            );
        });

        test('getStreamFields encodes tap and stream in URL', async () => {
            await api.getStreamFields('tap-shopify', 'orders');
            expect(mockGet).toHaveBeenCalledWith(
                '/catalogs/tap-shopify/streams/orders',
                expect.objectContaining({ timeout: 10000 }),
            );
        });

        test('searchCatalogs builds query string with params', async () => {
            await api.searchCatalogs('order', 'field', 25);
            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/catalogs/search?'),
                expect.objectContaining({ timeout: 10000 }),
            );
            const url = mockGet.mock.calls[0][0] as string;
            expect(url).toContain('q=order');
            expect(url).toContain('type=field');
            expect(url).toContain('limit=25');
        });

        test('searchCatalogs works with only query param', async () => {
            await api.searchCatalogs('order');
            const url = mockGet.mock.calls[0][0] as string;
            expect(url).toContain('q=order');
            expect(url).not.toContain('type=');
            expect(url).not.toContain('limit=');
        });

        test('listTemplates GETs /templates', async () => {
            await api.listTemplates();
            expect(mockGet).toHaveBeenCalledWith(
                '/templates',
                expect.objectContaining({ timeout: 10000 }),
            );
        });

        test('getTemplate GETs /templates/:name', async () => {
            await api.getTemplate('shopify-paid-media');
            expect(mockGet).toHaveBeenCalledWith(
                '/templates/shopify-paid-media',
                expect.objectContaining({ timeout: 10000 }),
            );
        });

        test('getPlatformCredentials sends user-id header', async () => {
            await api.getPlatformCredentials('user-123');
            expect(mockGet).toHaveBeenCalledWith(
                expect.stringContaining('/connectors/platform-credentials'),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'user-id': 'user-123',
                    }),
                }),
            );
        });

        test('getWebhookDiscoveryStatus GETs webhook status', async () => {
            await api.getWebhookDiscoveryStatus('browser_events');
            expect(mockGet).toHaveBeenCalledWith(
                '/webhooks/browser_events/discovery-status',
                expect.objectContaining({ timeout: 10000 }),
            );
        });

        test('introspectWebhookPayload POSTs to introspect endpoint', async () => {
            const payload = {
                source: 'browser_events',
                stream: 'page_view',
                payload: { url: 'https://example.com' },
            };
            await api.introspectWebhookPayload(payload);
            expect(mockPost).toHaveBeenCalledWith(
                '/catalogs/introspect-payload',
                payload,
                expect.objectContaining({ timeout: 15000 }),
            );
        });
    });

    // ── getBratraxOntologyModel ──────────────────────────────────────

    describe('getBratraxOntologyModel', () => {
        test('returns ontology model from service repository', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let api: any;
            jest.isolateModules(() => {
                api = require('../bratrax-api');
            });

            const mockModel = { upsertFile: jest.fn() };
            const mockServices = {
                models: {
                    getBratraxOntologyModel: jest
                        .fn()
                        .mockReturnValue(mockModel),
                },
            };

            const result = api.getBratraxOntologyModel(mockServices);
            expect(result).toBe(mockModel);
        });
    });

    // ── Retry interceptor registration ───────────────────────────────

    describe('retry interceptor', () => {
        test('registers a response interceptor on the axios instance', () => {
            jest.isolateModules(() => {
                require('../bratrax-api');
            });

            // The interceptor.response.use should have been called
            expect(mockInterceptorUse).toHaveBeenCalledTimes(1);
            expect(mockInterceptorUse).toHaveBeenCalledWith(
                expect.any(Function), // success handler
                expect.any(Function), // error handler
            );
        });
    });
});
