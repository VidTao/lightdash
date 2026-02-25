/**
 * Standardized pagination metadata for MCP tool responses.
 *
 * All paginated tools should include `hasMore` so clients know whether
 * to request the next page without computing it themselves.
 */
export type PaginationMeta = {
    page: number;
    pageSize: number;
    totalResults: number;
    hasMore: boolean;
};

/**
 * Build a standardized pagination metadata object.
 *
 * @param page - Current page number (1-based)
 * @param pageSize - Number of items per page
 * @param totalResults - Total number of matching items
 */
export function buildPaginationMeta(
    page: number,
    pageSize: number,
    totalResults: number,
): PaginationMeta {
    return {
        page,
        pageSize,
        totalResults,
        hasMore: page * pageSize < totalResults,
    };
}
