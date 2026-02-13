/**
 * Barrel that registers every MCP tool on a McpToolContext.
 *
 * To add a new tool:
 *   1. Create a new file in this directory (e.g. myNewTool.ts)
 *   2. Export a `registerMyNewTool(ctx: McpToolContext)` function
 *   3. Import & call it below
 */

import type { McpToolContext } from '../toolContext';
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
}
