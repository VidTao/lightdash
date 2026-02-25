// eslint-disable-next-line import/extensions
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { BratraxMcpToolName } from './types';

/**
 * Centralized tool annotations for all Bratrax MCP tools.
 *
 * MCP clients use these hints to decide confirmation prompts,
 * output handling, and tool selection priority.
 *
 * Categories:
 *   Read-only, closed-world  — safe to auto-approve
 *   Read-only, open-world    — queries external systems (warehouse, Python API)
 *   Mutation, idempotent      — writes state but safe to retry
 *   Mutation, destructive     — creates permanent resources, confirm first
 */
export const TOOL_ANNOTATIONS: Record<BratraxMcpToolName, ToolAnnotations> = {
    // ── Read-only, closed-world ──────────────────────────────────────
    [BratraxMcpToolName.GET_LIGHTDASH_VERSION]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.LIST_PROJECTS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.GET_CURRENT_PROJECT]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.LIST_EXPLORES]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.FIND_EXPLORES]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.FIND_FIELDS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.FIND_CONTENT]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.GET_EMBED_URL]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.CATALOG_LIST_TAPS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.CATALOG_GET_STREAMS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.CATALOG_GET_FIELDS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.CATALOG_SEARCH_FIELDS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.WORKSHOP_LIST_CLIENTS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.WORKSHOP_READ_CLIENT]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.WORKSHOP_LIST_TEMPLATES]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.WORKSHOP_GET_CATALOGS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.WEBHOOK_DISCOVERY_STATUS]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },

    // ── Read-only, open-world (queries external systems) ─────────────
    [BratraxMcpToolName.SEARCH_FIELD_VALUES]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
    [BratraxMcpToolName.RUN_METRIC_QUERY]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
    [BratraxMcpToolName.WORKSHOP_VALIDATE]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
    [BratraxMcpToolName.WORKSHOP_COMPILE]: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },

    // ── Mutation, idempotent ─────────────────────────────────────────
    [BratraxMcpToolName.SET_PROJECT]: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },
    [BratraxMcpToolName.WORKSHOP_WRITE_YAML]: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
    },

    // ── Mutation, destructive (creates permanent resources) ──────────
    [BratraxMcpToolName.WORKSHOP_CREATE_CLIENT]: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
    },
    [BratraxMcpToolName.GENERATE_DASHBOARD]: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
    },
    [BratraxMcpToolName.WEBHOOK_INTROSPECT]: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: true,
    },
    [BratraxMcpToolName.WORKSHOP_DEPLOY]: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
    },
};
