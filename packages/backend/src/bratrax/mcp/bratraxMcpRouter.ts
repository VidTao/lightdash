// eslint-disable-next-line import/extensions
import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
// eslint-disable-next-line import/extensions
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express, { type Router } from 'express';
import { IncomingMessage } from 'http';

import {
    ForbiddenError,
    getErrorMessage,
    LightdashError,
    MissingConfigError,
    ApiKeyAccount,
    OauthAccount,
    ServiceAcctAccount,
    UserAttributeValueMap,
} from '@lightdash/common';
import {
    allowApiKeyAuthentication,
} from '../../controllers/authentication';
import Logger from '../../logging/logger';
import type { BratraxMcpService } from './BratraxMcpService';
import type { ExtraContext } from './types';
import { userAttributeOverridesSchema } from '../../services/UserAttributesService/UserAttributeUtils';

const bratraxMcpRouter: Router = express.Router({ mergeParams: true });

function getMcpService(req: express.Request): BratraxMcpService {
    try {
        return req.services.getMcpServiceMain();
    } catch (e) {
        throw new MissingConfigError('MCP service not available');
    }
}

const MCP_USER_ATTRIBUTE_HEADER = 'X-Lightdash-User-Attributes';

/**
 * Extracts user attribute overrides from the X-Lightdash-User-Attributes header.
 * Header value should be a JSON object with string or string[] values.
 * Example: {"organizer_id": "123"} or {"organizer_id": ["123", "456"]}
 */
function extractUserAttributesFromHeader(
    req: express.Request,
): UserAttributeValueMap | undefined {
    const headerValue = req.headers[MCP_USER_ATTRIBUTE_HEADER.toLowerCase()];
    if (!headerValue || typeof headerValue !== 'string') {
        return undefined;
    }

    try {
        const parsed = JSON.parse(headerValue);
        const result = userAttributeOverridesSchema.safeParse(parsed);

        if (!result.success) {
            Logger.warn(
                `Invalid ${MCP_USER_ATTRIBUTE_HEADER} header: ${result.error.message}`,
            );
            return undefined;
        }

        return Object.keys(result.data).length > 0 ? result.data : undefined;
    } catch (e) {
        Logger.warn(
            `Failed to parse ${MCP_USER_ATTRIBUTE_HEADER} header: ${getErrorMessage(
                e,
            )}`,
        );
        return undefined;
    }
}

/*
MCP servers MUST use the HTTP header WWW-Authenticate when returning a 401 Unauthorized to indicate
the location of the resource server metadata URL as described in RFC9728 Section 5.1 "WWW-Authenticate Response".
https://www.rfc-editor.org/rfc/rfc9728#section-5.1
*/
const returnHeaderIfUnauthenticated = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
) => {
    if (req.account?.isAuthenticated()) {
        next();
    } else {
        res.set('WWW-Authenticate', 'ApiKey');
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Only these MCP methods access user data and need authentication.
// Everything else (initialize, notifications/*, tools/list, resources/list,
// prompts/list, ping, etc.) is protocol-level and can proceed without auth.
const METHODS_REQUIRING_AUTH = new Set([
    'tools/call',
    'resources/read',
    'resources/subscribe',
]);

const conditionalAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
) => {
    if (req.method === 'GET') {
        return next();
    }

    if (req.method === 'POST') {
        const method = req.body?.method;
        if (!method || !METHODS_REQUIRING_AUTH.has(method)) {
            return next();
        }
    }

    return returnHeaderIfUnauthenticated(req, res, next);
};

// MCP endpoint - supports Streamable HTTP
// Keep the MCP router as raw Express because:
// - MCP protocol requirements don't align with REST/TSOA patterns
// - We need full control over HTTP streaming and headers
// - It follows the same pattern as other protocol-specific endpoints (OAuth)
bratraxMcpRouter.all(
    '/',
    // Attempt API key authentication if header present
    (req, res, next) => {
        if (req.headers.authorization?.startsWith('ApiKey ')) {
            allowApiKeyAuthentication(req, res, next);
        } else {
            next();
        }
    },
    // Block unauthenticated requests for tool calls; allow protocol messages through
    conditionalAuth,
    async (req, res) => {
        try {
            const mcpService = getMcpService(req);

            // Check if MCP is enabled
            if (req.user) {
                const isEnabled = await mcpService.isEnabled(req.user);
                if (!isEnabled) {
                    throw new ForbiddenError('MCP is not enabled');
                }
            } else {
                // For unauthenticated requests, check global config
                if (!mcpService.lightdashConfig.mcp.enabled) {
                    throw new ForbiddenError('MCP is not enabled');
                }
            }

            if (req.method === 'GET') {
                // Handle SSE transport
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Cache-Control',
                });

                const heartbeat = setInterval(() => {
                    res.write('event: heartbeat\ndata: {}\n\n');
                }, 30000);

                req.on('close', () => {
                    clearInterval(heartbeat);
                });

                res.write('event: connect\ndata: {"type": "connect"}\n\n');
                return await Promise.resolve();
            }

            if (req.method === 'POST') {
                // Create a fresh McpServer per request — stateless Streamable
                // HTTP requires this because the MCP SDK's Protocol class
                // throws "Already connected" on a reused server instance.
                const mcpServer = mcpService.createRequestServer();
                const transport = new StreamableHTTPServerTransport({
                    enableJsonResponse: true,
                    sessionIdGenerator: undefined,
                });
                await mcpServer.connect(transport);

                // Extract user attributes from header (for row-level security)
                const headerUserAttributes =
                    extractUserAttributesFromHeader(req);

                // Add auth info for authenticated requests
                const authReq: IncomingMessage & { auth?: AuthInfo } = req;

                if (req.user && req.account?.isAuthenticated()) {
                    let extra: ExtraContext;

                    if (req.account.isPatUser()) {
                        const apiKeyAuth = req.account as ApiKeyAccount;
                        extra = {
                            user: req.user,
                            account: apiKeyAuth,
                            headerUserAttributes,
                        };
                        authReq.auth = {
                            token: apiKeyAuth.authentication.source,
                            clientId: 'api-key-client',
                            scopes: ['mcp:read', 'mcp:write'],
                            extra,
                        };
                    }
                }

                if (req.user && req.account?.isServiceAccount()) {
                    const serviceAccountAuth =
                        req.account as ServiceAcctAccount;
                    const extra: ExtraContext = {
                        user: req.user,
                        account: serviceAccountAuth,
                        headerUserAttributes,
                    };
                    authReq.auth = {
                        token: serviceAccountAuth.authentication.source,
                        clientId: 'Service account',
                        scopes: ['mcp:read', 'mcp:write'],
                        extra,
                    };
                }

                try {
                    return await transport.handleRequest(authReq, res, req.body);
                } finally {
                    await mcpServer.close();
                }
            }

            res.status(405).json({ error: 'Method not allowed' });
            return await Promise.resolve();
        } catch (error) {
            Logger.error(`MCP endpoint error: ${getErrorMessage(error)}`);
            if (error instanceof LightdashError) {
                return res.status(error.statusCode).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
);

export default bratraxMcpRouter;
