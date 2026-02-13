/**
 * Shared context interface for MCP tool registration functions.
 *
 * BratraxMcpService builds this from its private state and passes it to each
 * tool's register function.  This avoids circular imports (tool files never
 * import BratraxMcpService) and keeps the dependency surface explicit.
 */

import {
    Account,
    AnyType,
    ChartType,
    CreateSavedChart,
    Explore,
    SessionUser,
    ToolRunQueryArgsTransformed,
    UserAttributeValueMap,
} from '@lightdash/common';
// eslint-disable-next-line import/extensions
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z, ZodRawShape } from 'zod';
import { LightdashAnalytics } from '../../analytics/LightdashAnalytics';
import { LightdashConfig } from '../../config/parseConfig';
import { McpContextModel } from '../../models/McpContextModel';
import { ProjectModel } from '../../models/ProjectModel/ProjectModel';
import { SavedChartModel } from '../../models/SavedChartModel';
import { SearchModel } from '../../models/SearchModel';
import { SpaceModel } from '../../models/SpaceModel';
import { UserAttributesModel } from '../../models/UserAttributesModel';
import { AsyncQueryService } from '../../services/AsyncQueryService/AsyncQueryService';
import { CatalogService } from '../../services/CatalogService/CatalogService';
import { FeatureFlagService } from '../../services/FeatureFlag/FeatureFlagService';
import { ProjectService } from '../../services/ProjectService/ProjectService';
import { ServiceRepository } from '../../services/ServiceRepository';
import { SpaceService } from '../../services/SpaceService/SpaceService';
import type { McpProtocolContext } from './types';

export interface McpToolContext {
    // ── Core ───────────────────────────────────────────────────────────
    server: McpServer;
    config: LightdashConfig;
    analytics: LightdashAnalytics;

    // ── Services & Models ──────────────────────────────────────────────
    asyncQueryService: AsyncQueryService;
    catalogService: CatalogService;
    projectService: ProjectService;
    projectModel: ProjectModel;
    userAttributesModel: UserAttributesModel;
    searchModel: SearchModel;
    spaceService: SpaceService;
    spaceModel: SpaceModel;
    mcpContextModel: McpContextModel;
    featureFlagService: FeatureFlagService;
    services: ServiceRepository;
    savedChartModel: SavedChartModel;

    // ── Schema helper ──────────────────────────────────────────────────
    compatSchema(schema: z.ZodSchema<unknown>): ZodRawShape;

    // ── Auth & context helpers ─────────────────────────────────────────
    getAccount(ctx: McpProtocolContext): {
        user: SessionUser;
        organizationUuid: string;
        account: Account;
    };
    canAccessMcp(ctx: McpProtocolContext): boolean;
    resolveProjectUuid(ctx: McpProtocolContext): Promise<string>;
    getTagsFromContext(ctx: McpProtocolContext): Promise<string[] | null>;
    getMergedUserAttributes(
        ctx: McpProtocolContext,
    ): Promise<UserAttributeValueMap>;
    getUserAttributeOverrides(
        ctx: McpProtocolContext,
    ): Promise<UserAttributeValueMap | undefined>;
    getAvailableExplores(
        user: SessionUser,
        projectUuid: string,
        tags: string[] | null,
        attrOverrides?: UserAttributeValueMap,
    ): Promise<Explore[]>;
    requireProjectAccess(
        ctx: McpProtocolContext,
        projectUuid: string,
    ): Promise<void>;
    trackToolCall(
        ctx: McpProtocolContext,
        toolName: string,
        projectUuid?: string,
    ): void;
    textResult(text: string): { content: { type: 'text'; text: string }[] };

    // ── Query / chart helpers ──────────────────────────────────────────
    buildMetricQueryFromViz(
        viz: ToolRunQueryArgsTransformed,
        explore: Explore,
    ): AnyType;
    mapChartType(defaultVizType: string | null | undefined): ChartType;
    buildChartConfig(
        chartType: ChartType,
        defaultVizType: string | null | undefined,
        dimensions: string[],
        metrics: string[],
    ): CreateSavedChart['chartConfig'];
}
