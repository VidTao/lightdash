import { ForbiddenError, MissingConfigError } from '@lightdash/common';

// Mock external modules before imports
jest.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
    McpServer: jest.fn().mockImplementation(() => ({
        registerTool: jest.fn(),
        prompt: jest.fn(),
    })),
}));

jest.mock('@sentry/node', () => ({
    wrapMcpServerWithSentry: jest.fn((server) => server),
    setTag: jest.fn(),
}));

jest.mock('../../version', () => ({ VERSION: '0.0.0-test' }));

jest.mock('../mcp/tools', () => ({
    registerAllTools: jest.fn(),
}));

jest.mock('../mcp/prompts/workshops', () => ({
    registerAllPrompts: jest.fn(),
}));

jest.mock('../mcp/mcpSchemaCompat', () => ({
    McpSchemaCompatLayer: jest.fn().mockImplementation(() => ({
        processZodType: jest.fn().mockReturnValue({ shape: {} }),
    })),
}));

import { BratraxMcpService } from '../mcp/BratraxMcpService';
import type { McpProtocolContext } from '../mcp/types';

// ── Helpers ──────────────────────────────────────────────────────────

function makeMockConfig(overrides: Record<string, unknown> = {}) {
    return {
        mcp: { enabled: true },
        siteUrl: 'http://localhost:3000',
        ai: {
            copilot: { maxQueryLimit: 500, maxFilterLimit: 500 },
        },
        ...overrides,
    } as any;
}

function makeMockContext(
    overrides: Partial<McpProtocolContext> = {},
): McpProtocolContext {
    return {
        authInfo: {
            extra: {
                user: {
                    userUuid: 'user-uuid-1',
                    organizationUuid: 'org-uuid-1',
                    ability: {
                        can: jest.fn().mockReturnValue(true),
                        cannot: jest.fn().mockReturnValue(false),
                    },
                },
                account: { organizationUuid: 'org-uuid-1' },
            },
        },
        ...overrides,
    } as any;
}

function makeService(configOverrides: Record<string, unknown> = {}) {
    return new BratraxMcpService({
        lightdashConfig: makeMockConfig(configOverrides),
        analytics: { track: jest.fn() } as any,
        asyncQueryService: {} as any,
        catalogService: {} as any,
        projectModel: {} as any,
        projectService: {} as any,
        userAttributesModel: {} as any,
        searchModel: {} as any,
        spaceService: {} as any,
        mcpContextModel: {} as any,
        featureFlagService: {} as any,
        services: {} as any,
        savedChartModel: {} as any,
        spaceModel: {} as any,
    });
}

// ── Tests ────────────────────────────────────────────────────────────

describe('BratraxMcpService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ── canAccessMcp ─────────────────────────────────────────────────

    describe('canAccessMcp', () => {
        test('returns true when authInfo is present and MCP is enabled', () => {
            const service = makeService();
            const ctx = makeMockContext();
            expect(service.canAccessMcp(ctx)).toBe(true);
        });

        test('throws ForbiddenError when authInfo is missing', () => {
            const service = makeService();
            const ctx = makeMockContext({ authInfo: undefined } as any);
            expect(() => service.canAccessMcp(ctx)).toThrow(ForbiddenError);
        });

        test('throws MissingConfigError when MCP is disabled', () => {
            const service = makeService({ mcp: { enabled: false } });
            const ctx = makeMockContext();
            expect(() => service.canAccessMcp(ctx)).toThrow(MissingConfigError);
        });
    });

    // ── requireProjectAccess ─────────────────────────────────────────

    describe('requireProjectAccess', () => {
        test('resolves when user has view ability', async () => {
            const mockProject = {
                organizationUuid: 'org-uuid-1',
                projectUuid: 'proj-uuid-1',
            };
            const service = makeService();
            // Access private method for testing
            const projectService = {
                getProject: jest.fn().mockResolvedValue(mockProject),
            };
            (service as any).projectService = projectService;

            const ctx = makeMockContext();
            const requireAccess = (service as any).requireProjectAccess.bind(
                service,
            );
            await expect(
                requireAccess(ctx, 'proj-uuid-1'),
            ).resolves.toBeUndefined();
            expect(projectService.getProject).toHaveBeenCalledWith(
                'proj-uuid-1',
                ctx.authInfo!.extra.account,
            );
        });

        test('throws ForbiddenError when user cannot view project', async () => {
            const mockProject = {
                organizationUuid: 'org-uuid-1',
                projectUuid: 'proj-uuid-1',
            };
            const service = makeService();
            (service as any).projectService = {
                getProject: jest.fn().mockResolvedValue(mockProject),
            };

            const ctx = makeMockContext();
            ctx.authInfo!.extra.user.ability.cannot = jest
                .fn()
                .mockReturnValue(true);

            const requireAccess = (service as any).requireProjectAccess.bind(
                service,
            );
            await expect(
                requireAccess(ctx, 'proj-uuid-1'),
            ).rejects.toThrow(ForbiddenError);
        });
    });

    // ── textResult ───────────────────────────────────────────────────

    describe('textResult', () => {
        test('returns text content when under 1MB limit', () => {
            const service = makeService();
            const text = 'Hello, world!';
            // @ts-expect-error - accessing private method for testing
            const result = service.textResult(text);
            expect(result).toEqual({
                content: [{ type: 'text', text: 'Hello, world!' }],
            });
            expect(result.isError).toBeUndefined();
        });

        test('returns truncation error when over 1MB limit', () => {
            const service = makeService();
            const bigText = 'x'.repeat(1024 * 1024 + 1);
            // @ts-expect-error - accessing private method for testing
            const result = service.textResult(bigText);
            expect(result.isError).toBe(true);
            expect(result.content[0].text).toContain('Result truncated');
            expect(result.content[0].text).toContain('1MB limit');
        });

        test('includes correct size in truncation error message', () => {
            const service = makeService();
            // 2MB of data
            const bigText = 'x'.repeat(2 * 1024 * 1024);
            // @ts-expect-error - accessing private method for testing
            const result = service.textResult(bigText);
            expect(result.content[0].text).toContain('2.0MB');
        });

        test('returns text at exactly 1MB without error', () => {
            const service = makeService();
            const exactText = 'x'.repeat(1024 * 1024);
            // @ts-expect-error - accessing private method for testing
            const result = service.textResult(exactText);
            expect(result.isError).toBeUndefined();
            expect(result.content[0].text).toBe(exactText);
        });
    });

    // ── createRequestServer ──────────────────────────────────────────

    describe('createRequestServer', () => {
        test('returns a new server instance', () => {
            const service = makeService();
            const server = service.createRequestServer();
            expect(server).toBeDefined();
        });

        test('returns different instances on each call', () => {
            const service = makeService();
            const server1 = service.createRequestServer();
            const server2 = service.createRequestServer();
            expect(server1).not.toBe(server2);
        });

        test('does not replace the original server', () => {
            const service = makeService();
            const originalServer = service.getServer();
            service.createRequestServer();
            expect(service.getServer()).toBe(originalServer);
        });
    });

    // ── getAccount ───────────────────────────────────────────────────

    describe('getAccount', () => {
        test('returns user, organizationUuid, and account', () => {
            const service = makeService();
            const ctx = makeMockContext();
            const result = service.getAccount(ctx);
            expect(result.user).toBeDefined();
            expect(result.organizationUuid).toBe('org-uuid-1');
            expect(result.account).toBeDefined();
        });

        test('throws ForbiddenError when user is missing', () => {
            const service = makeService();
            const ctx = makeMockContext();
            ctx.authInfo!.extra.user = undefined as any;
            expect(() => service.getAccount(ctx)).toThrow(ForbiddenError);
        });

        test('throws ForbiddenError when organizationUuid is missing', () => {
            const service = makeService();
            const ctx = makeMockContext();
            ctx.authInfo!.extra.user.organizationUuid = undefined;
            expect(() => service.getAccount(ctx)).toThrow(ForbiddenError);
        });
    });
});
