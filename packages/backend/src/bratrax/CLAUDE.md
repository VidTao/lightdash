# Bratrax Extension Module

Custom extension module for the Bratrax fork of Lightdash. Parallel to `/ee/` but with original implementations (no EE code copies) to comply with the Source Available license.

## How It Plugs In

The single integration point is `src/index.ts` line 28:

```
...(await getBratraxAppArguments()),
```

This replaces the upstream `getEnterpriseAppArguments()` call. The function returns `{ serviceProviders, modelProviders, clientProviders }` — same shape as the EE module. ServiceRepository checks providers first, so our services override the defaults.

**Files touched in core codebase (merge conflict points):**

| File | Change | Conflict risk |
|------|--------|---------------|
| `src/index.ts` | Import + call `getBratraxAppArguments()` instead of EE | 1 line on upstream merge |
| `routers/apiV1Router.ts` | Import `bratraxMcpRouter` instead of `mcpRouter` | 2 lines (import + use) |
| `services/ServiceRepository.ts` | Import `BratraxMcpService`, use in manifest + factory | ~5 lines |

The original `routers/mcpRouter.ts` is **not used** — it exists for upstream merge compatibility. All MCP routing lives in `bratrax/mcp/bratraxMcpRouter.ts`.

## Directory Structure

```
bratrax/
  index.ts                        # getBratraxAppArguments() — provider factory
  CLAUDE.md                       # This file
  services/
    BratraxEmbedService.ts        # Embed service: JWT auth, URL generation, dashboard rendering
  mcp/
    bratraxMcpRouter.ts           # Express router for POST /api/v1/mcp
    BratraxMcpService.ts          # Orchestrator: class + helpers, delegates to tools/
    toolContext.ts                 # McpToolContext interface shared by all tool files
    mcpSchemaCompat.ts            # Converts Zod schemas to JSON Schema for MCP SDK
    mcpAppHelpers.ts              # registerAppTool/registerAppResource wrappers
    types.ts                      # ExtraContext, McpProtocolContext, BratraxMcpToolName enum
    tools/                        # One file per MCP tool (git-conflict-free)
      index.ts                    # registerAllTools() barrel — single merge point
      getVersion.ts               # get_lightdash_version
      listExplores.ts             # list_explores
      findExplores.ts             # find_explores
      findFields.ts               # find_fields
      findContent.ts              # find_content
      listProjects.ts             # list_projects
      setProject.ts               # set_project
      getCurrentProject.ts        # get_current_project
      runMetricQuery.ts           # run_metric_query
      searchFieldValues.ts        # search_field_values
      getEmbedUrl.ts              # get_embed_url
      generateDashboard.ts        # generate_dashboard
    utils/
      exploreContext.ts           # ExploreContext — cached explore list per user+project
      pivotResults.ts             # DuckDB-based result pivoting
      customMetrics.ts            # Injects SQL for custom metric definitions
      serializeData.ts            # JSON/CSV output serializer
```

### Adding a New MCP Tool

1. Create `mcp/tools/myNewTool.ts` exporting `registerMyNewToolTool(ctx: McpToolContext): void`
2. Add the tool name to `BratraxMcpToolName` enum in `types.ts`
3. Import and call your register function in `tools/index.ts`
4. That's it — no changes to `BratraxMcpService.ts` needed

## MCP Server Architecture

### Protocol: Streamable HTTP (stateless)

The MCP endpoint at `POST /api/v1/mcp` uses the MCP SDK's Streamable HTTP transport in **stateless mode** (`sessionIdGenerator: undefined`). This means:

- **A fresh McpServer is created per request** via `BratraxMcpService.createRequestServer()`
- The MCP SDK's Protocol class throws "Already connected" if you reuse a server instance
- `registerTools()` is synchronous (just sets up callbacks), so the temporary `this.mcpServer` swap in `createRequestServer()` is safe in Node's single-threaded event loop
- The router calls `mcpServer.close()` in a `finally` block after each request

### Authentication Flow

```
Client sends: POST /api/v1/mcp
  Header: Authorization: ApiKey <personal-access-token>

1. Express middleware checks for "ApiKey " prefix
2. allowApiKeyAuthentication() runs passport HeaderAPIKeyStrategy
3. Strategy calls userService.loginWithPersonalAccessToken(token)
4. On success: req.user = SessionUser, req.account = ApiKeyAccount
5. conditionalAuth checks if this MCP method needs auth:
   - tools/call, resources/read, resources/subscribe → require auth (401 if missing)
   - initialize, tools/list, resources/list, prompts/list → allowed without auth
6. Router attaches ExtraContext to AuthInfo.extra on the transport request
7. Tool handlers extract user/account from ctx.authInfo.extra
```

Service account auth (Bearer tokens) follows the same flow via the EE `authenticateServiceAccount` middleware.

### Conditional Auth (blocklist)

The `METHODS_REQUIRING_AUTH` blocklist in bratraxMcpRouter controls which MCP protocol methods require authentication. Only `tools/call`, `resources/read`, and `resources/subscribe` are gated — everything else (protocol messages like `initialize`, `notifications/initialized`, `tools/list`, `ping`, etc.) passes through without auth.

This blocklist approach is used instead of a whitelist because:
- LibreChat's global startup connection sends `initialize` and `tools/list` without any API key (the key is only resolved per-user)
- New MCP protocol methods won't accidentally get blocked — only data-access methods are gated
- A whitelist previously broke on `notifications/initialized` which wasn't listed

### MCP Tools (12 total)

| Tool | Auth required | Description |
|------|:---:|-------------|
| `get_lightdash_version` | yes | Returns server version |
| `list_projects` | yes | Lists accessible projects |
| `set_project` | yes | Sets active project context (stored in McpContextModel) |
| `get_current_project` | yes | Returns current project context |
| `list_explores` | yes | Lists all explores in project |
| `find_explores` | yes | Searches explores by name/description |
| `find_fields` | yes | Searches fields in catalog |
| `find_content` | yes | Searches dashboards/charts |
| `run_metric_query` | yes | Executes a metric query, returns data |
| `search_field_values` | yes | Gets distinct values for a field |
| `get_embed_url` | yes | Generates a signed embed JWT URL |
| `generate_dashboard` | yes | Creates a real dashboard with saved charts |

All tools are registered in `BratraxMcpService.registerTools()`. Each tool handler calls `this.resolveAuthContext(ctx)` to get the SessionUser and project UUID from the MCP protocol context.

## LibreChat Integration

The MCP server is consumed by LibreChat as a `streamable-http` MCP server. Config in `LibreChat/librechat.yaml`:

```yaml
mcpServers:
  dbt-mcp-lightdash:              # Name must match — LibreChat stores API keys per server name
    type: streamable-http
    url: "https://bratrax.com/api/v1/mcp"
    headers:
      Authorization: "ApiKey {{MCP_LIGHTDASH_API_KEY}}"
    customUserVars:
      MCP_LIGHTDASH_API_KEY:
        title: "Lightdash API Key"
        description: "API key for Lightdash authentication"
```

Key details:
- The server name `dbt-mcp-lightdash` is significant — LibreChat stores user API keys as `mcp_<serverName>` in customUserVars. Renaming breaks existing stored keys.
- `{{MCP_LIGHTDASH_API_KEY}}` is resolved per-user from their LibreChat settings.
- At startup (global connection), the `{{...}}` var is NOT resolved, so `initialize` and `tools/list` must work without auth.

## Key Dependencies from @lightdash/common

The MCP tools use Zod schemas from `@lightdash/common` for input validation:
- `toolRunQueryArgsSchema` / `toolRunQueryArgsSchemaTransformed` — run_metric_query input
- `toolDashboardV2ArgsSchema` / `toolDashboardV2ArgsSchemaTransformed` — generate_dashboard input
- `toolFindExploresArgsSchemaV3` — find_explores input
- `toolFindFieldsArgsSchema` — find_fields input
- `toolFindContentArgsSchema` — find_content input
- `toolGetEmbedUrlArgsSchema` — get_embed_url input
- `toolSearchFieldValuesArgsSchema` — search_field_values input
- `mcpToolListExploresArgsSchema` — list_explores input

These schemas are defined in `packages/common/src/types/aiCopilot.ts`.

## BratraxEmbedService

Full embed service with EE feature parity (~1450 lines). No EE code copies — all methods are original implementations following the same patterns. No license gating, no admin config UI (auto-provisions instead), no permission checks beyond the JWT boundary.

**Dependencies:** `DashboardModel`, `AsyncQueryService`, `ProjectModel`, `SavedChartModel`, `LightdashAnalytics`. Passed from `bratrax/index.ts` via the provider factory.

**Key architectural insight:** `AsyncQueryService extends ProjectService`, so the `asyncQueryService` dependency gives access to all ProjectService methods (`_compileQuery`, `getResultsFromCacheOrWarehouse`, `_getWarehouseClient`, `combineParameters`, `_getCalculateTotalQuery`, `_getFieldValuesMetricQuery`, `projectParametersModel`).

### Auto-provisioning

The service **auto-provisions** the embed config when it doesn't exist. On the first `get_embed_url` call for a project:

1. `ensureEmbedConfigured()` checks the `embedding` table for a row matching the project UUID
2. If missing, generates a random 32-byte secret (`crypto.randomBytes`)
3. Encrypts it with `EncryptionUtil` (AES-256-GCM, keyed on `lightdashSecret` from config)
4. Inserts into the `embedding` table with `allow_all_dashboards: true`, `allow_all_charts: true`, and `ON CONFLICT` merge (race-safe)
5. Logs: `Auto-provisioned embed config for project <uuid>`

No manual admin setup needed — the embed row is created transparently on first use.

**Permission model:** The core `PermissionsService.checkEmbedPermissions()` checks `embed.allowAllDashboards` and `embed.dashboardUuids` on every tile query. Our `getEmbedConfig()` always returns `allowAllDashboards: true` and `allowAllCharts: true` regardless of the DB value, because the JWT is our permission boundary — if a dashboard UUID is in the JWT, the user is authorized. This avoids requiring admin UI to manage allowed dashboards/charts lists.

### How embed JWTs work

The `embedding` table stores an `encoded_secret` (encrypted) per project. `encodeLightdashJwt()` decrypts this secret using `EncryptionUtil` and signs the JWT with it. The JWT contains:
- `content`: `{ type: 'dashboard', dashboardUuid, canExportCsv, canExportImages }` or `{ type: 'chart', contentId }`
- `userAttributes`: for row-level security filtering
- Signed with the project's embed secret, expiry configurable (default 8h from MCP tool)

The frontend `/embed/:projectUuid#<jwt>` route decodes and verifies the JWT to render the embedded dashboard/chart.

### JWT Authentication Middleware (`getAccountFromJwt`)

When a browser visits an embed URL, the global `jwtAuthMiddleware` intercepts the request and calls `embedService.getAccountFromJwt(projectUuid, token)`. Our implementation:

1. `getEmbedConfig()` — reads the `embedding` row joined with `projects` and `organizations` to build an `OssEmbed` object (project UUID, encoded secret, org info, dashboard/chart UUIDs)
2. `decodeLightdashJwt()` — decrypts the secret and verifies the JWT signature
3. `getEmbedUserAttributes()` — merges org-level default user attributes with JWT-provided overrides (for row-level security)
4. `getContentFromJwt()` — resolves `EmbedContent` from the JWT (dashboard UUID, chart UUIDs, content type)
5. `fromJwt()` — creates an `AnonymousAccount` with CASL abilities scoped to the embedded content

The middleware (at `src/middlewares/jwtAuthMiddleware/`) is part of the core codebase and imports `EmbedService` from EE by type. It calls `req.services.getEmbedService()` which returns our `BratraxEmbedService` via the provider override — so `getAccountFromJwt` must exist on our service.

### Methods (all fully implemented)

| Method | Description |
|--------|-------------|
| `getDashboard()` | Returns dashboard + interactivity options from JWT. Tracks analytics. |
| `executeAsyncDashboardTileQuery()` | Per-tile filter resolution, parameter combining, delegates to `AsyncQueryService` with `QueryExecutionContext.EMBED` |
| `getChartAndResults()` | Deprecated sync query path — full implementation with `_runEmbedQuery` pipeline |
| `getAvailableFiltersForSavedQueries()` | Filter resolution with explore caching. Returns empty if filter interactivity disabled. |
| `calculateTotalFromSavedChart()` | Totals for saved chart in embed context via `_getCalculateTotalQuery` |
| `calculateSubtotalsFromSavedChart()` | Subtotals via `SubtotalsCalculator` + parallel `_runEmbedQuery` calls |
| `calculateTotalFromQuery()` | Totals for raw metric query (no dashboard context) |
| `calculateSubtotalsFromQuery()` | Subtotals for raw metric query |
| `searchFilterValues()` | Filter value autocomplete via `_getFieldValuesMetricQuery` + `_runEmbedQuery` |

### Core private helpers

| Helper | Description |
|--------|-------------|
| `getAccessControls()` | Extract `userAttributes` + `intrinsicUserAttributes` from `AnonymousAccount` |
| `_getWarehouseClient()` | Get warehouse client + SSH tunnel for a project/explore |
| `getAvailableParameters()` | Get available parameter definitions for an explore |
| `_runEmbedQuery()` | Core query executor: warehouse client → filter explore by user attrs → compile → execute → disconnect SSH |
| `_getChartFromDashboardTiles()` | Find chart tile by UUID in dashboard, load saved chart |
| `_getAppliedDashboardFilters()` | Per-tile filter scoping via `getDashboardFiltersForTileAndTables()` |
| `_prepareSavedChartForCalculation()` | Shared setup for calculation methods — handles both chart and dashboard embeds |
| `_calculateSubtotalsForEmbed()` | Parallel subtotal queries via `SubtotalsCalculator` dimension groups |

### What we intentionally skip (vs EE)

- **Admin config** (`getConfig`, `createConfig`, `updateDashboards`, `updateConfig`) — we auto-provision via `ensureEmbedConfigured()`
- **License gating** (`isFeatureEnabled`) — no Keygen integration
- **Dashboard permission checks** (`checkDashboardPermissions`, `_permissionsGetChartAndResults`) — the signed JWT is our permission boundary
