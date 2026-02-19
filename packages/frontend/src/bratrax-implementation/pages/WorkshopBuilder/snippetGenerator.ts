/**
 * Auto-generate code snippets from event definitions.
 *
 * Browser events: analytics.page() / analytics.track() / analytics.identify() / analytics.group()
 * Webhook events: curl POST example with JSON payload
 * API pull events: informational note (no snippet — data is pulled by Meltano tap)
 */
import type { TrackingEvent } from './types';

function sanitizeName(name: string): string {
    return name.replace(/['"\\]/g, '_');
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
            return '"2026-01-01T00:00:00Z"';
        case 'JSON':
            return '{}';
        default:
            return '""';
    }
}

function formatBrowserProperties(event: TrackingEvent): string {
    if (event.properties.length === 0) return '{}';

    const lines = event.properties.map((prop) => {
        const comment = prop.required ? ' // required' : '';
        const placeholder = getPlaceholder(prop.type);
        return `  ${prop.name}: ${placeholder},${comment}`;
    });

    return `{\n${lines.join('\n')}\n}`;
}

function formatWebhookPayload(event: TrackingEvent): string {
    if (event.properties.length === 0) return '{}';

    const lines = event.properties.map((prop) => {
        const placeholder = getPlaceholder(prop.type);
        return `    "${prop.name}": ${placeholder}`;
    });

    return `{\n${lines.join(',\n')}\n  }`;
}

function generateBrowserSnippet(event: TrackingEvent): string {
    const props = formatBrowserProperties(event);
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

function generateWebhookSnippet(event: TrackingEvent): string {
    const safeName = sanitizeName(event.name);
    const payload = formatWebhookPayload(event);
    const source = event.source || '<webhook-source>';

    return [
        `# Webhook: ${safeName}`,
        `# Source: ${source}`,
        `# This event is received via webhook POST — not sent from browser code.`,
        ``,
        `curl -X POST \\`,
        `  -H "Content-Type: application/json" \\`,
        `  -d '${payload}' \\`,
        `  https://\${WEBHOOK_ENDPOINT}/${safeName}`,
    ].join('\n');
}

function generateApiPullSnippet(event: TrackingEvent): string {
    const safeName = sanitizeName(event.name);
    const source = event.source || '<tap-source>';

    return [
        `# API Pull: ${safeName}`,
        `# Source: ${source}`,
        `# This event is pulled by a Meltano tap on a schedule.`,
        `# No code snippet needed — data is extracted automatically.`,
    ].join('\n');
}

export function generateSnippet(event: TrackingEvent): string {
    switch (event.collectionMethod) {
        case 'webhook':
            return generateWebhookSnippet(event);
        case 'api_pull':
            return generateApiPullSnippet(event);
        case 'browser':
        default:
            return generateBrowserSnippet(event);
    }
}

export function generateFullSnippet(event: TrackingEvent): string {
    const snippet = generateSnippet(event);
    const requiredProps = event.properties.filter((p) => p.required);

    const lines: string[] = [];

    if (requiredProps.length > 0) {
        const commentChar = event.collectionMethod === 'browser' ? '//' : '#';
        lines.push(`${commentChar} Required fields:`);
        for (const prop of requiredProps) {
            lines.push(`${commentChar}   ${prop.name} (${prop.type})`);
        }
        lines.push('');
    }

    lines.push(snippet);

    return lines.join('\n');
}
