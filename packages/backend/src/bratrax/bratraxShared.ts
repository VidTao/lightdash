import {
    compileYaml,
    getBratraxDiscoveryModel,
    getBratraxOntologyModel,
    validateYaml,
} from '../helpers/bratrax-api';
import { buildCatalogMap } from '../helpers/bratrax-catalog-parser';
import type { ServiceRepository } from '../services/ServiceRepository';

/**
 * Fetch YAML files + catalogs for a project, then validate.
 * Used by both REST routes and MCP tools to ensure consistent behavior.
 *
 * BUG FIX: The REST route previously omitted catalogs, causing validation
 * to miss source-field resolution that the MCP tool caught.  This shared
 * function always includes catalogs from the discovery DB.
 */
export async function validateProject(
    projectUuid: string,
    services: ServiceRepository,
): Promise<unknown> {
    const model = getBratraxOntologyModel(services);
    const files = await model.getFiles(projectUuid);

    const discoveryModel = getBratraxDiscoveryModel(services);
    const catalogRows =
        await discoveryModel.getCatalogsForProject(projectUuid);
    const catalogs = buildCatalogMap(catalogRows);

    return validateYaml({
        config: files.config ?? '',
        ontology: files.ontology ?? '',
        sources: files.sources ?? '',
        tracking_plan: files.tracking_plan ?? '',
        catalogs,
    });
}

/**
 * Fetch YAML files + catalogs for a project, then compile.
 * Used by both REST routes and MCP tools to ensure consistent behavior.
 *
 * BUG FIX: The REST route previously omitted catalogs, causing compilation
 * to miss source-field resolution that the MCP tool caught.  This shared
 * function always includes catalogs from the discovery DB.
 */
export async function compileProject(
    projectUuid: string,
    services: ServiceRepository,
): Promise<unknown> {
    const model = getBratraxOntologyModel(services);
    const files = await model.getFiles(projectUuid);

    const discoveryModel = getBratraxDiscoveryModel(services);
    const catalogRows =
        await discoveryModel.getCatalogsForProject(projectUuid);
    const catalogs = buildCatalogMap(catalogRows);

    return compileYaml({
        config: files.config ?? '',
        ontology: files.ontology ?? '',
        sources: files.sources ?? '',
        tracking_plan: files.tracking_plan ?? '',
        catalogs,
    });
}
