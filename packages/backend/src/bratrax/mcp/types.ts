import type {
    Account,
    ApiKeyAccount,
    CatalogField,
    OauthAccount,
    ServiceAcctAccount,
    SessionUser,
    UserAttributeValueMap,
} from '@lightdash/common';
// eslint-disable-next-line import/extensions
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';

/**
 * Auth context attached to every authenticated MCP request.
 * Carried inside `AuthInfo.extra` by the mcpRouter.
 */
export type ExtraContext = {
    user: SessionUser;
    account: OauthAccount | ApiKeyAccount | ServiceAcctAccount;
    /** User attribute overrides passed via X-Lightdash-User-Attributes header */
    headerUserAttributes?: UserAttributeValueMap;
};

/**
 * Protocol-level context available inside every MCP tool handler.
 */
export type McpProtocolContext = {
    authInfo?: AuthInfo & {
        extra: ExtraContext;
    };
};

/**
 * Names of all MCP tools exposed by the Bratrax MCP server.
 */
export enum BratraxMcpToolName {
    GET_LIGHTDASH_VERSION = 'get_lightdash_version',
    LIST_EXPLORES = 'list_explores',
    FIND_EXPLORES = 'find_explores',
    FIND_FIELDS = 'find_fields',
    FIND_CONTENT = 'find_content',
    LIST_PROJECTS = 'list_projects',
    SET_PROJECT = 'set_project',
    GET_CURRENT_PROJECT = 'get_current_project',
    RUN_METRIC_QUERY = 'run_metric_query',
    SEARCH_FIELD_VALUES = 'search_field_values',
    GET_EMBED_URL = 'get_embed_url',
    GENERATE_DASHBOARD = 'generate_dashboard',

    // Catalog tools (granular)
    CATALOG_LIST_TAPS = 'catalog_list_taps',
    CATALOG_GET_STREAMS = 'catalog_get_streams',
    CATALOG_GET_FIELDS = 'catalog_get_fields',
    CATALOG_SEARCH_FIELDS = 'catalog_search_fields',

    // Workshop tools
    WORKSHOP_LIST_CLIENTS = 'workshop_list_clients',
    WORKSHOP_CREATE_CLIENT = 'workshop_create_client',
    WORKSHOP_READ_CLIENT = 'workshop_read_client',
    WORKSHOP_WRITE_YAML = 'workshop_write_yaml',
    WORKSHOP_VALIDATE = 'workshop_validate',
    WORKSHOP_COMPILE = 'workshop_compile',
    WORKSHOP_GET_CATALOGS = 'workshop_get_catalogs',
    WORKSHOP_LIST_TEMPLATES = 'workshop_list_templates',
    WORKSHOP_DEPLOY = 'workshop_deploy',

    // Webhook discovery tools
    WEBHOOK_DISCOVERY_STATUS = 'webhook_discovery_status',
    WEBHOOK_INTROSPECT = 'webhook_introspect',
}

/**
 * Result shape returned by the find-explores dependency.
 */
export type FindExploresResult = {
    exploreSearchResults: Array<{
        name: string;
        label: string;
        description?: string;
        aiHints?: string;
        searchRank?: number;
        joinedTables?: string[];
    }>;
    topMatchingFields: Array<{
        name: string;
        label: string;
        tableName?: string;
        fieldType?: string;
        searchRank?: number;
        description?: string;
    }>;
};

/**
 * Result shape returned by the find-fields dependency.
 */
export type FindFieldsResult = {
    fields: CatalogField[];
    pagination?: {
        page: number;
        pageSize: number;
        totalResults: number;
    };
};

/**
 * Result shape returned by the find-content dependency.
 */
export type FindContentResult = {
    content: Array<{
        uuid: string;
        name: string;
        description?: string | null;
        spaceUuid: string;
        [key: string]: unknown;
    }>;
};

/**
 * Callback that executes a metric query and returns rows + fields.
 */
export type RunAsyncQueryFn = (
    metricQuery: Record<string, unknown>,
    additionalMetrics?: unknown[],
) => Promise<{
    rows: Record<string, unknown>[];
    fields: Record<string, unknown>;
}>;
