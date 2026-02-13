/**
 * Wraps data in a fenced code block suitable for MCP text responses.
 */
export function serializeData(
    data: unknown,
    format: 'json' | 'csv' | 'raw',
): string {
    switch (format) {
        case 'json':
            return ['```json', JSON.stringify(data, null, 2), '```'].join('\n');
        case 'csv':
            return ['```csv', data, '```'].join('\n');
        case 'raw':
            return ['```', data, '```'].join('\n');
        default:
            throw new Error(`Unsupported serialization format: ${format}`);
    }
}
