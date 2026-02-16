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
import { registerGetVersionTool } from './getVersion';
import { registerListExploresTool } from './listExplores';
import { registerFindExploresTool } from './findExplores';
import { registerFindFieldsTool } from './findFields';
import { registerFindContentTool } from './findContent';
import { registerListProjectsTool } from './listProjects';
import { registerSetProjectTool } from './setProject';
import { registerGetCurrentProjectTool } from './getCurrentProject';
import { registerRunMetricQueryTool } from './runMetricQuery';
import { registerSearchFieldValuesTool } from './searchFieldValues';
import { registerGetEmbedUrlTool } from './getEmbedUrl';
import { registerGenerateDashboardTool } from './generateDashboard';
import { registerWorkshopListClientsTool } from './workshopListClients';
import { registerWorkshopCreateClientTool } from './workshopCreateClient';
import { registerWorkshopReadClientTool } from './workshopReadClient';
import { registerWorkshopWriteYamlTool } from './workshopWriteYaml';
import { registerWorkshopValidateTool } from './workshopValidate';
import { registerWorkshopCompileTool } from './workshopCompile';
import { registerWorkshopGetCatalogsTool } from './workshopGetCatalogs';
import { registerWorkshopListTemplatesTool } from './workshopListTemplates';
import { registerWorkshopDeployTool } from './workshopDeploy';

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
}
