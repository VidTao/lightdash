import type {
    AdditionalMetric,
    CustomMetricBaseTransformed,
    Explore,
} from '@lightdash/common';
import { getFields, getItemId } from '@lightdash/common';

/**
 * Populates the `sql` property for a single custom metric by looking up
 * its base dimension in the explore definition.
 *
 * Custom metrics arrive without SQL (for security) but the query engine
 * needs it at execution time.
 */
function populateSingleMetricSQL(
    metric: CustomMetricBaseTransformed | Omit<AdditionalMetric, 'sql'>,
    explore: Explore,
): AdditionalMetric | null {
    const allFields = getFields(explore);
    const baseDimension = allFields.find(
        (field) =>
            metric.baseDimensionName &&
            getItemId(field) ===
                getItemId({
                    table: metric.table,
                    name: metric.baseDimensionName,
                }),
    );

    if (!baseDimension) return null;

    return { ...metric, sql: baseDimension.sql };
}

/**
 * Takes an array of custom metrics (without SQL) and populates each one's
 * `sql` from the matching dimension in the given explore.
 * Metrics whose base dimension cannot be found are silently dropped.
 */
export function populateCustomMetricsSQL(
    customMetrics:
        | (CustomMetricBaseTransformed | Omit<AdditionalMetric, 'sql'>)[]
        | null
        | undefined,
    explore: Explore,
): AdditionalMetric[] {
    if (!customMetrics || customMetrics.length === 0) return [];

    const populated: AdditionalMetric[] = [];
    for (const metric of customMetrics) {
        const result = populateSingleMetricSQL(metric, explore);
        if (result) populated.push(result);
    }
    return populated;
}
