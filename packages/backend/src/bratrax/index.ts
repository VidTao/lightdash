import { BratraxMcpService } from './mcp/BratraxMcpService';
import { BratraxEmbedService } from './services/BratraxEmbedService';

/**
 * Returns provider overrides for the Bratrax extension module.
 *
 * This function mirrors the shape of `getEnterpriseAppArguments()` from
 * the EE module, letting it slot into the same integration point in
 * `src/index.ts`.  Currently it supplies an MCP service provider and
 * an embed service provider; additional providers (models, clients,
 * middleware) can be added here as Bratrax features grow.
 */
export async function getBratraxAppArguments() {
    return {
        serviceProviders: {
            embedService: ({
                context,
                repository,
                models,
            }: {
                context: { lightdashConfig: any; lightdashAnalytics: any };
                repository: any;
                models: any;
            }) =>
                new BratraxEmbedService({
                    database: models.getDatabase(),
                    lightdashConfig: context.lightdashConfig,
                    dashboardModel: models.getDashboardModel(),
                    asyncQueryService: repository.getAsyncQueryService(),
                    projectModel: models.getProjectModel(),
                    savedChartModel: models.getSavedChartModel(),
                    analytics: context.lightdashAnalytics,
                }),
            mcpServiceMain: ({
                context,
                repository,
                models,
            }: {
                context: { lightdashConfig: any; lightdashAnalytics: any };
                repository: any;
                models: any;
            }) =>
                new BratraxMcpService({
                    lightdashConfig: context.lightdashConfig,
                    analytics: context.lightdashAnalytics,
                    asyncQueryService: repository.getAsyncQueryService(),
                    catalogService: repository.getCatalogService(),
                    projectService: repository.getProjectService(),
                    userAttributesModel: models.getUserAttributesModel(),
                    searchModel: models.getSearchModel(),
                    spaceModel: models.getSpaceModel(),
                    spaceService: repository.getSpaceService(),
                    mcpContextModel: models.getMcpContextModel(),
                    projectModel: models.getProjectModel(),
                    featureFlagService: repository.getFeatureFlagService(),
                    services: repository,
                    savedChartModel: models.getSavedChartModel(),
                }),
        },
        modelProviders: {},
        clientProviders: {},
    };
}
