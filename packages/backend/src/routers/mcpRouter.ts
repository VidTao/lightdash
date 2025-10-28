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
    LightdashSessionUser,
    MissingConfigError,
    NotImplementedError,
    ApiKeyAccount,
    OauthAccount,
    OauthAuth,
} from '@lightdash/common';
import {
    allowApiKeyAuthentication, // ← Changed from allowOauthAuthentication
    isAuthenticated,
} from '../controllers/authentication';
import Logger from '../logging/logger';
import { ExtraContext, McpServiceMain } from '../services/McpService/McpServiceMain';
const mcpRouter: Router = express.Router({ mergeParams: true });

function getMcpService(req: express.Request): McpServiceMain {
    try {
        return req.services.getMcpServiceMain();
    } catch (e) {
        throw new MissingConfigError('MCP service not available');
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
        // For API Key authentication, we still provide OAuth metadata for MCP spec compliance
        const oauthService = req.services.getOauthService();
        const baseUrl = oauthService.getSiteUrl();
        res.set('WWW-Authenticate', 'ApiKey');
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Add a middleware to conditionally require auth
const conditionalAuth = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
) => {
    // Always allow GET requests (SSE handshake)
    if (req.method === 'GET') {
        return next();
    }
    
    // For POST requests, check if it's an initial connection or handshake
    if (req.method === 'POST') {
        const method = req.body?.method;
        const allowedUnauthenticatedMethods = [
            'initialize',
            'tools/list',
            'resources/list',
            'prompts/list'
        ];
        
        // Allow unauthenticated access for handshake methods OR if no method specified (initial connection)
        if (!method || allowedUnauthenticatedMethods.includes(method)) {
            return next();
        }
    }
    
    // Require auth for everything else (actual tool calls)
    return returnHeaderIfUnauthenticated(req, res, next);
};

// MCP endpoint - supports Streamable HTTP
// Keep the MCP router as raw Express because:
// - MCP protocol requirements don't align with REST/TSOA patterns
// - We need full control over HTTP streaming and headers
// - It follows the same pattern as other protocol-specific endpoints (OAuth)
mcpRouter.all(
    '/',
    // Only check for API key in headers, don't return 401 if missing
    (req, res, next) => {
        if (req.headers.authorization?.startsWith('ApiKey ')) {
            // Process API key authentication
            allowApiKeyAuthentication(req, res, next);
        } else {
            // Allow unauthenticated access (or return different error)
            next();
        }
    },
    async (req, res) => {
        try {
            console.log('MCP Request:', {
                method: req.method,
                hasUser: !!req.user,
                hasAuth: !!req.headers.authorization,
                userUuid: req.user?.userUuid
            });

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

            const mcpServer = mcpService.getServer();

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
                // Handle Streamable HTTP transport
                const transport = new StreamableHTTPServerTransport({
                    enableJsonResponse: true,
                    sessionIdGenerator: undefined,
                });
                await mcpServer.connect(transport);

                // Add auth info for authenticated requests
                const authReq: IncomingMessage & { auth?: AuthInfo } = req;

                if (req.user && req.account?.isAuthenticated()) {
                    let extra: ExtraContext;
                    
                    if (req.account.isPatUser()) {
                        const apiKeyAuth = req.account as ApiKeyAccount;
                        extra = {
                            user: req.user,
                            account: apiKeyAuth,
                        };
                        authReq.auth = {
                            token: apiKeyAuth.authentication.source,
                            clientId: 'api-key-client',
                            scopes: ['mcp:read', 'mcp:write'],
                            extra,
                        };
                    }
                }

                return await transport.handleRequest(authReq, res, req.body);
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

export default mcpRouter;
