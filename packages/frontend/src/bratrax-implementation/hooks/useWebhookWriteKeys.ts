/**
 * Fetch webhook write keys from the main Bratrax server.
 * Reuses the existing useWriteKeys pattern but specifically
 * filters for webhook-type platforms.
 */
import { useWriteKeys } from './useWriteKeys';

export interface WebhookWriteKey {
    platform: string;
    writeKey: string;
    webhookUrl: string;
}

const WEBHOOK_PLATFORMS: Record<string, string> = {
    leadbyte: 'https://api.bratrax.com/leadbyte/track',
    slack_app: 'https://api.bratrax.com/slack-app/track',
};

export function useWebhookWriteKeys(source: string) {
    const { writeKeys, isLoading, error } = useWriteKeys({ source });

    const webhookKeys: WebhookWriteKey[] = writeKeys.map((wk) => ({
        platform: wk.platform,
        writeKey: wk.writeKey,
        webhookUrl:
            WEBHOOK_PLATFORMS[source] ??
            `https://api.bratrax.com/${source}/track`,
    }));

    return {
        keys: webhookKeys,
        isLoading,
        error,
    };
}
