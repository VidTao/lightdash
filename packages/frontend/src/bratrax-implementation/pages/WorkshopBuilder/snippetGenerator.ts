/**
 * Auto-generate JavaScript tracking code snippets from event definitions.
 *
 * Produces analytics.page(), analytics.track(), analytics.identify(),
 * or analytics.group() calls based on event category and properties.
 */
import type { TrackingEvent } from './types';

function sanitizeName(name: string): string {
    return name.replace(/['"\\]/g, '_');
}

function formatProperties(event: TrackingEvent): string {
    if (event.properties.length === 0) return '{}';

    const lines = event.properties.map((prop) => {
        const comment = prop.required ? ' // required' : '';
        const placeholder = getPlaceholder(prop.type);
        return `  ${prop.name}: ${placeholder},${comment}`;
    });

    return `{\n${lines.join('\n')}\n}`;
}

function getPlaceholder(type: string): string {
    switch (type) {
        case 'INT64':
        case 'FLOAT64':
            return '0';
        case 'BOOLEAN':
            return 'false';
        case 'TIMESTAMP':
        case 'DATE':
            return "new Date().toISOString()";
        case 'JSON':
            return '{}';
        default:
            return "''";
    }
}

export function generateSnippet(event: TrackingEvent): string {
    const props = formatProperties(event);

    const safeName = sanitizeName(event.name);

    switch (event.category) {
        case 'page_view':
            return [
                `// Track: ${safeName}`,
                `analytics.page(${props});`,
            ].join('\n');

        case 'identify':
            return [
                `// Identify: ${safeName}`,
                `analytics.identify(userId, ${props});`,
            ].join('\n');

        case 'group':
            return [
                `// Group: ${safeName}`,
                `analytics.group(groupId, ${props});`,
            ].join('\n');

        case 'track':
        default:
            return [
                `// Track: ${safeName}`,
                `analytics.track('${safeName}', ${props});`,
            ].join('\n');
    }
}

export function generateFullSnippet(event: TrackingEvent): string {
    const snippet = generateSnippet(event);
    const requiredProps = event.properties.filter((p) => p.required);

    const lines: string[] = [];

    if (requiredProps.length > 0) {
        lines.push('// Required fields:');
        for (const prop of requiredProps) {
            lines.push(`//   ${prop.name} (${prop.type})`);
        }
        lines.push('');
    }

    lines.push(snippet);

    return lines.join('\n');
}
