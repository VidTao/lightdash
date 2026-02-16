/**
 * MCP Prompts for Bratrax Ontology Workshops and Event Storms.
 *
 * These prompts guide Claude through structured methodology to build
 * client YAML files conversationally, using the workshop_* MCP tools.
 */

// eslint-disable-next-line import/extensions
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// ── Ontology Workshop ──────────────────────────────────────────────────

const ONTOLOGY_WORKSHOP_PROMPT = `You are running a Bratrax Ontology Workshop. Your goal is to help the user define their business data model by creating ontology.yaml and sources.yaml files for a Bratrax client.

## Available Tools
- workshop_list_clients: See existing clients
- workshop_create_client: Create a new client from a template
- workshop_read_client: Read existing YAML files
- workshop_write_yaml: Write YAML files
- workshop_validate: Validate the client
- workshop_list_templates: List stack templates

### Catalog Discovery (use these to explore data sources)
- catalog_list_taps: List available taps with stream counts
- catalog_get_streams: Get streams for a specific tap
- catalog_get_fields: Get field schema for a specific stream
- catalog_search_fields: Search for fields by name across all taps

## Workshop Phases

### Phase 1: Entity Elicitation
Ask the user about their business domain. Identify the core business objects:
- What are the main things your business tracks? (Customers, Orders, Products, etc.)
- How do users interact with your product?
- What data do you report on?

### Phase 2: Property Definition
For each entity, define its properties. There are 3 kinds:
- **backing** (\`$sources.X.Y.Z\`): Maps directly to a field in a data source
- **derived** (\`$events.X\`): Derived from tracking events
- **computed** (SQL formula): Calculated from other properties

Ask about data types: STRING, INT64, FLOAT64, BOOL, TIMESTAMP, DATE, JSON

### Phase 3: Relationship Mapping
Define links between entities:
- one_to_many (Customer -> Orders)
- many_to_one (Order -> Customer)
- many_to_many (Product -> Categories)
Ask about join keys for each relationship.

### Phase 4: Source Binding
Use catalog_list_taps to discover available Meltano taps.
Use catalog_get_streams to explore streams within a tap.
Use catalog_get_fields to see field schemas for a stream.
Use catalog_search_fields to find fields like "email" or "spend" across taps.
Map each backing property to a specific source stream and field.
Write sources.yaml with the tap, raw_table, streams, and fields.

### Phase 5: Validation
Use workshop_validate to check for errors.
Fix any issues by rewriting the affected YAML file.
Iterate until validation passes.

## YAML Schema: ontology.yaml
\`\`\`yaml
objects:
  <entity_name>:
    display_name: "Human Name"
    description: "What this entity represents"
    properties:
      <prop_name>:
        type: STRING|INT64|FLOAT64|BOOL|TIMESTAMP|DATE|JSON
        description: "What this property represents"
        backing: $sources.<source>.<stream>.<field>  # OR
        derived: $events.<event_name>                # OR
        computed: "SQL expression"
links:
  <link_name>:
    from: <entity>
    to: <entity>
    type: one_to_many|many_to_one|many_to_many
    join_key: <field_name>
metrics:
  <metric_name>:
    display_name: "Human Name"
    sql: "SQL aggregation expression"
\`\`\`

## YAML Schema: sources.yaml
\`\`\`yaml
sources:
  <source_name>:
    tap: tap-<name>
    raw_table: bratrax.raw_data.<table_name>
    streams:
      <stream_name>:
        fields:
          <field_name>: { type: STRING|INT64|FLOAT64|BOOL|TIMESTAMP }
\`\`\`

## Instructions
1. Start by reading the client's current YAML if it exists
2. Work through each phase conversationally
3. After each phase, use workshop_write_yaml to save progress
4. Validate after writing to catch issues early
5. Be specific about data types and $ref syntax
`;

// ── Event Storm ────────────────────────────────────────────────────────

const EVENT_STORM_PROMPT = `You are running a Bratrax Event Storm. Your goal is to help the user discover and define their business events by creating tracking_plan.yaml for a Bratrax client.

## Available Tools
- workshop_read_client: Read existing YAML files (especially ontology.yaml)
- workshop_write_yaml: Write tracking_plan.yaml
- workshop_validate: Validate the client
- catalog_list_taps / catalog_get_streams / catalog_get_fields: Discover data sources
- catalog_search_fields: Search for fields across all taps

## Event Storm Phases

### Phase 1: Event Elicitation
Ask about the user journey and business processes:
- What actions do users take? (views, clicks, purchases, signups)
- What happens in the backend? (order fulfilled, payment processed)
- What external events occur? (ad impression, email opened)

### Phase 2: Event Categorization
Group events into categories:
- ecommerce (order_completed, product_viewed, cart_updated)
- engagement (page_viewed, button_clicked, search_performed)
- acquisition (ad_clicked, signup_completed, referral_created)
- lifecycle (subscription_started, churn_detected)

### Phase 3: Property Definition
For each event, define its payload properties:
- What data is captured with this event?
- Data types: STRING, INT64, FLOAT64, BOOL, TIMESTAMP
- Which properties link to entities in the ontology?

### Phase 4: Entity Enrichment Mapping
Map events to object derived properties in ontology.yaml:
- Which events update which entity properties?
- Use $events.<event_name> references in ontology properties

### Phase 5: Source Assignment + Validation
- Assign raw_table sources for event data
- Use workshop_validate to verify everything connects
- Fix any broken references

## YAML Schema: tracking_plan.yaml
\`\`\`yaml
categories:
  <category_name>:
    display_name: "Human Name"

events:
  <event_name>:
    category: <category_name>
    description: "What triggers this event"
    properties:
      <prop_name>:
        type: STRING|INT64|FLOAT64|BOOL|TIMESTAMP
        description: "What this property contains"
    source:
      raw_table: bratrax.raw_data.<table>
      event_column: event_name
      event_value: <event_name>
\`\`\`

## Instructions
1. Start by reading ontology.yaml to understand existing entities
2. Work through each phase conversationally
3. After defining events, write tracking_plan.yaml
4. Check that event references in ontology.yaml are valid
5. Validate to catch issues
`;

// ── Full Workshop ──────────────────────────────────────────────────────

const FULL_WORKSHOP_PROMPT = `You are running a Full Bratrax Workshop combining an Ontology Workshop and Event Storm. This is a comprehensive session to build a complete client data model from scratch.

## Flow
1. **Setup**: Create or select a client using workshop_create_client or workshop_list_clients
2. **Ontology Workshop**: Define entities, properties, relationships, and sources
3. **Event Storm**: Discover events, categorize them, define payloads, and map to entities
4. **Compile**: Use workshop_compile to generate Dataform and Meltano artifacts
5. **Deploy**: Use workshop_deploy to show the deployment plan (dry-run first)

## All Available Tools
- workshop_list_clients / workshop_create_client
- workshop_read_client / workshop_write_yaml
- workshop_validate / workshop_compile / workshop_deploy
- workshop_list_templates
- catalog_list_taps / catalog_get_streams / catalog_get_fields / catalog_search_fields

## Key Principles
- Work iteratively: write -> validate -> fix -> repeat
- Be conversational: ask clarifying questions
- Show the user what you're writing before committing
- Validate after every major change
- Use catalogs to ground source bindings in real data

Start by asking about the business and what data sources they have.
`;

// ── Registration ───────────────────────────────────────────────────────

export function registerAllPrompts(server: McpServer): void {
    server.prompt(
        'ontology_workshop',
        'Run a guided Ontology Workshop to define business entities, properties, and data sources for a Bratrax client.',
        {
            client_name: z
                .string()
                .describe('Name of the client to work with'),
            business_description: z
                .string()
                .optional()
                .describe(
                    'Optional description of the business to help guide entity discovery',
                ),
        },
        async (args) => {
            const context = args.business_description
                ? `\n\nBusiness context: ${args.business_description}`
                : '';
            return {
                messages: [
                    {
                        role: 'user' as const,
                        content: {
                            type: 'text' as const,
                            text:
                                ONTOLOGY_WORKSHOP_PROMPT +
                                `\n\nClient name: ${args.client_name}` +
                                context +
                                '\n\nPlease begin the ontology workshop.',
                        },
                    },
                ],
            };
        },
    );

    server.prompt(
        'event_storm',
        'Run a guided Event Storm to discover and define business events for a Bratrax client.',
        {
            client_name: z
                .string()
                .describe('Name of the client to work with'),
        },
        async (args) => ({
            messages: [
                {
                    role: 'user' as const,
                    content: {
                        type: 'text' as const,
                        text:
                            EVENT_STORM_PROMPT +
                            `\n\nClient name: ${args.client_name}` +
                            '\n\nPlease begin the event storm.',
                    },
                },
            ],
        }),
    );

    server.prompt(
        'full_workshop',
        'Run a complete Bratrax Workshop: ontology definition, event storm, compile, and deploy.',
        {
            client_name: z
                .string()
                .describe('Name of the client to work with'),
            business_description: z
                .string()
                .optional()
                .describe(
                    'Optional description of the business to help guide the workshop',
                ),
        },
        async (args) => {
            const context = args.business_description
                ? `\n\nBusiness context: ${args.business_description}`
                : '';
            return {
                messages: [
                    {
                        role: 'user' as const,
                        content: {
                            type: 'text' as const,
                            text:
                                FULL_WORKSHOP_PROMPT +
                                `\n\nClient name: ${args.client_name}` +
                                context +
                                '\n\nPlease begin the full workshop.',
                        },
                    },
                ],
            };
        },
    );
}
