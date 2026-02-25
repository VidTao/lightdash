/**
 * MCP Prompts for Bratrax Ontology Workshops.
 *
 * Single bottlenecked prompt with 7 gated steps.
 * Each step has explicit gate conditions that MUST pass before advancing.
 * The 3 registered MCP prompts are thin entry-point wrappers.
 *
 * The full prompt text lives in workshop-full.md (easier to diff and maintain).
 */

// eslint-disable-next-line import/extensions
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// ── Load prompt from markdown file at startup ───────────────────────

const BOTTLENECKED_WORKSHOP_PROMPT = fs.readFileSync(
    path.join(__dirname, 'workshop-full.md'),
    'utf-8',
);

// ── Thin wrappers ────────────────────────────────────────────────────

const ONTOLOGY_ONLY_SUFFIX = `

## SCOPE: Ontology Workshop Only (Steps 0-5)
You are running an Ontology Workshop (not a full workshop). Complete Steps 0 through 5 only. After Step 5 validation passes, the workshop is DONE. Do NOT proceed to Steps 6-7 unless the user explicitly asks.`;

const EVENT_STORM_SUFFIX = `

## SCOPE: Event Storm Only (Step 6)
You are running an Event Storm for a client that already has config.yaml, sources.yaml, and ontology.yaml.

**Pre-flight:**
1. Call \`workshop_read_client\` to load all existing YAML files.
2. Scan ontology.yaml for \`$events.X\` references — list them as demanded events.
3. List all source keys from sources.yaml with their types (meltano / webhook / pubsub).
4. Check whether \`browser_events\` source exists. Flag if missing.
5. Present pre-flight summary, then proceed to Step 6.

Execute Step 6 only (phases 6A-6F). After Gate 6 validation passes, the event storm is DONE.
Do NOT proceed to Step 7 unless the user explicitly asks.`;

// ── Registration ─────────────────────────────────────────────────────

export function registerAllPrompts(server: McpServer): void {
    server.prompt(
        'full_workshop',
        'Run a complete Bratrax Workshop: 7 gated steps from business discovery through compile and deploy.',
        {
            client_name: z.string().describe('Name of the client to work with'),
            business_description: z
                .string()
                .optional()
                .describe(
                    'Optional description of the business to help guide the workshop',
                ),
        },
        async (args) => {
            const context = args.business_description
                ? `\n\nBusiness context provided: ${args.business_description}`
                : '';
            return {
                messages: [
                    {
                        role: 'user' as const,
                        content: {
                            type: 'text' as const,
                            text: `${
                                BOTTLENECKED_WORKSHOP_PROMPT
                            }\n\nClient name: ${args.client_name}${
                                context
                            }\n\nBegin at Step 0. Ask the business discovery questions.`,
                        },
                    },
                ],
            };
        },
    );

    server.prompt(
        'ontology_workshop',
        'Run a guided Ontology Workshop (Steps 0-5): business discovery, source mapping, entity definition, and ontology validation.',
        {
            client_name: z.string().describe('Name of the client to work with'),
            business_description: z
                .string()
                .optional()
                .describe(
                    'Optional description of the business to help guide entity discovery',
                ),
        },
        async (args) => {
            const context = args.business_description
                ? `\n\nBusiness context provided: ${args.business_description}`
                : '';
            return {
                messages: [
                    {
                        role: 'user' as const,
                        content: {
                            type: 'text' as const,
                            text: `${
                                BOTTLENECKED_WORKSHOP_PROMPT +
                                ONTOLOGY_ONLY_SUFFIX
                            }\n\nClient name: ${args.client_name}${
                                context
                            }\n\nBegin at Step 0. Ask the business discovery questions.`,
                        },
                    },
                ],
            };
        },
    );

    server.prompt(
        'event_storm',
        'Run a guided Event Storm (Step 6): discover events, define tracking plan, and validate against existing ontology.',
        {
            client_name: z.string().describe('Name of the client to work with'),
        },
        async (args) => ({
            messages: [
                {
                    role: 'user' as const,
                    content: {
                        type: 'text' as const,
                        text:
                            `${
                                BOTTLENECKED_WORKSHOP_PROMPT +
                                EVENT_STORM_SUFFIX
                            }\n\nClient name: ${args.client_name}` +
                            `\n\nStart by reading the existing client YAML with workshop_read_client, then begin Step 6.`,
                    },
                },
            ],
        }),
    );
}
