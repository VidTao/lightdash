/**
 * Barrel that registers every MCP tool on a McpToolContext.
 *
 * To add a new tool:
 *   1. Create a new file in this directory (e.g. myNewTool.ts)
 *   2. Export a `registerMyNewTool(ctx: McpToolContext)` function
 *   3. Import & call it below
 */

import type { McpToolContext } from '../toolContext';
import { registerCatalogGetFieldsTool } from './catalogGetFields';
import { registerCatalogGetStreamsTool } from './catalogGetStreams';
import { registerCatalogListTapsTool } from './catalogListTaps';
import { registerCatalogSearchFieldsTool } from './catalogSearchFields';
import { registerFindContentTool } from './findContent';
import { registerFindExploresTool } from './findExplores';
import { registerFindFieldsTool } from './findFields';
import { registerGenerateDashboardTool } from './generateDashboard';
import { registerGetCurrentProjectTool } from './getCurrentProject';
import { registerGetEmbedUrlTool } from './getEmbedUrl';
import { registerGetVersionTool } from './getVersion';
import { registerListExploresTool } from './listExplores';
import { registerListProjectsTool } from './listProjects';
import { registerRunMetricQueryTool } from './runMetricQuery';
import { registerSearchFieldValuesTool } from './searchFieldValues';
import { registerSetProjectTool } from './setProject';
import { registerWebhookDiscoveryStatusTool } from './webhookDiscoveryStatus';
import { registerWebhookIntrospectTool } from './webhookIntrospect';
import { registerWorkshopCompileTool } from './workshopCompile';
import { registerWorkshopCreateClientTool } from './workshopCreateClient';
import { registerWorkshopDeployTool } from './workshopDeploy';
import { registerWorkshopGetCatalogsTool } from './workshopGetCatalogs';
import { registerWorkshopListClientsTool } from './workshopListClients';
import { registerWorkshopListTemplatesTool } from './workshopListTemplates';
import { registerWorkshopReadClientTool } from './workshopReadClient';
import { registerWorkshopValidateTool } from './workshopValidate';
import { registerWorkshopWriteYamlTool } from './workshopWriteYaml';

export function registerAllTools(ctx: McpToolContext): void {
    registerGetVersionTool(ctx);
    registerListExploresTool(ctx);
    registerFindExploresTool(ctx);
    registerFindFieldsTool(ctx);
    registerFindContentTool(ctx);
    registerListProjectsTool(ctx);
    registerSetProjectTool(ctx);
    registerGetCurrentProjectTool(ctx);
    registerRunMetricQueryTool(ctx);
    registerSearchFieldValuesTool(ctx);
    registerGetEmbedUrlTool(ctx);
    registerGenerateDashboardTool(ctx);

    // Catalog tools (granular)
    registerCatalogListTapsTool(ctx);
    registerCatalogGetStreamsTool(ctx);
    registerCatalogGetFieldsTool(ctx);
    registerCatalogSearchFieldsTool(ctx);

    // Workshop tools
    registerWorkshopListClientsTool(ctx);
    registerWorkshopCreateClientTool(ctx);
    registerWorkshopReadClientTool(ctx);
    registerWorkshopWriteYamlTool(ctx);
    registerWorkshopValidateTool(ctx);
    registerWorkshopCompileTool(ctx);
    registerWorkshopGetCatalogsTool(ctx);
    registerWorkshopListTemplatesTool(ctx);
    registerWorkshopDeployTool(ctx);

    // Webhook discovery tools
    registerWebhookDiscoveryStatusTool(ctx);
    registerWebhookIntrospectTool(ctx);
}
