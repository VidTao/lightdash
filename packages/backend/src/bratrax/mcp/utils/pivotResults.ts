import type { SortField } from '@lightdash/common';
import { tableFromJSON, tableToIPC } from 'apache-arrow';
import { Database } from 'duckdb-async';

/**
 * Pivots query result rows using DuckDB's in-memory PIVOT statement.
 *
 * Given flat rows, a set of pivot fields, metrics, and sort configuration,
 * this function loads the data into DuckDB via Arrow IPC, runs a PIVOT query,
 * and returns the pivoted rows along with the new metric column names.
 */
export async function pivotResults(
    rows: Record<string, unknown>[],
    fieldsMap: Record<string, unknown>,
    pivotFields: string[],
    metrics: string[],
    sorts: SortField[],
): Promise<{
    results: Record<string, unknown>[];
    metrics: string[];
}> {
    const fieldNames = Object.keys(fieldsMap);
    const arrowTable = tableFromJSON(rows);
    const db = await Database.create(':memory:');

    await db.exec('INSTALL arrow; LOAD arrow;');
    await db.register_buffer('pivot_data', [tableToIPC(arrowTable)], true);

    const aggregations = metrics.map((m) => `FIRST(${m})`);

    // Columns that are neither pivot keys nor metrics become GROUP BY columns
    const groupByFields = fieldNames.filter(
        (f) => !pivotFields.includes(f) && !metrics.includes(f),
    );

    // After pivot, only GROUP BY columns survive as sortable
    const validSorts = sorts.filter((s) => groupByFields.includes(s.fieldId));
    const orderByClause = validSorts.length
        ? `ORDER BY ${validSorts
              .map((s) => {
                  const dir = s.descending ? 'DESC' : 'ASC';
                  const nulls =
                      s.nullsFirst === undefined
                          ? ''
                          : s.nullsFirst
                            ? ' NULLS FIRST'
                            : ' NULLS LAST';
                  return `${s.fieldId} ${dir}${nulls}`;
              })
              .join(', ')}`
        : '';

    const groupByClause = groupByFields.length
        ? `GROUP BY ${groupByFields.join(', ')}`
        : '';

    let sql: string;
    if (pivotFields.length === 1) {
        sql = `PIVOT pivot_data ON ${pivotFields[0]} USING ${aggregations.join(', ')} ${groupByClause} ${orderByClause}`;
    } else {
        // Composite key for multi-field pivot
        const compositeKey = pivotFields
            .map((f) => `COALESCE(CAST(${f} AS VARCHAR), 'NULL')`)
            .join(" || ' - ' || ");
        sql = `PIVOT (SELECT *, ${compositeKey} as __pivot_key__ FROM pivot_data) ON __pivot_key__ USING ${aggregations.join(', ')} ${groupByClause} ${orderByClause}`;
    }

    const pivoted = await db.all(sql);
    const pivotedColumns = Object.keys(pivoted[0] ?? {});

    return {
        results: pivoted,
        metrics: pivotedColumns.filter((col) => !fieldNames.includes(col)),
    };
}
