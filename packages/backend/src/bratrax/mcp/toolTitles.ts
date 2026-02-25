import { BratraxMcpToolName } from './types';

/**
 * Human-readable display titles for all Bratrax MCP tools.
 *
 * Shown in MCP client UIs (Claude Code tool list, LibreChat tool picker).
 * Keep titles short (<40 chars) and action-oriented.
 */
export const TOOL_TITLES: Record<BratraxMcpToolName, string> = {
    // Core Lightdash tools
    [BratraxMcpToolName.GET_LIGHTDASH_VERSION]: 'Get Lightdash Version',
    [BratraxMcpToolName.LIST_PROJECTS]: 'List Projects',
    [BratraxMcpToolName.SET_PROJECT]: 'Set Active Project',
    [BratraxMcpToolName.GET_CURRENT_PROJECT]: 'Get Current Project',
    [BratraxMcpToolName.LIST_EXPLORES]: 'List Explores',
    [BratraxMcpToolName.FIND_EXPLORES]: 'Find Explores',
    [BratraxMcpToolName.FIND_FIELDS]: 'Find Fields',
    [BratraxMcpToolName.FIND_CONTENT]: 'Find Content',
    [BratraxMcpToolName.RUN_METRIC_QUERY]: 'Run Metric Query',
    [BratraxMcpToolName.SEARCH_FIELD_VALUES]: 'Search Field Values',
    [BratraxMcpToolName.GET_EMBED_URL]: 'Get Embed URL',
    [BratraxMcpToolName.GENERATE_DASHBOARD]: 'Generate Dashboard',

    // Catalog tools
    [BratraxMcpToolName.CATALOG_LIST_TAPS]: 'List Data Source Taps',
    [BratraxMcpToolName.CATALOG_GET_STREAMS]: 'Get Tap Streams',
    [BratraxMcpToolName.CATALOG_GET_FIELDS]: 'Get Stream Fields',
    [BratraxMcpToolName.CATALOG_SEARCH_FIELDS]: 'Search Catalog Fields',

    // Workshop tools
    [BratraxMcpToolName.WORKSHOP_LIST_CLIENTS]: 'Check Ontology Status',
    [BratraxMcpToolName.WORKSHOP_CREATE_CLIENT]: 'Initialize Ontology',
    [BratraxMcpToolName.WORKSHOP_READ_CLIENT]: 'Read Ontology YAML',
    [BratraxMcpToolName.WORKSHOP_WRITE_YAML]: 'Write Ontology YAML',
    [BratraxMcpToolName.WORKSHOP_VALIDATE]: 'Validate Ontology',
    [BratraxMcpToolName.WORKSHOP_COMPILE]: 'Compile Ontology',
    [BratraxMcpToolName.WORKSHOP_GET_CATALOGS]: 'Get Source Catalogs',
    [BratraxMcpToolName.WORKSHOP_LIST_TEMPLATES]: 'List Stack Templates',
    [BratraxMcpToolName.WORKSHOP_DEPLOY]: 'Deploy Artifacts',

    // Webhook tools
    [BratraxMcpToolName.WEBHOOK_DISCOVERY_STATUS]: 'Check Webhook Discovery',
    [BratraxMcpToolName.WEBHOOK_INTROSPECT]: 'Introspect Webhook Payload',
};
