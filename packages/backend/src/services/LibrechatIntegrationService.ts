import axios from 'axios';
import { LightdashUser } from '@lightdash/common';
import { LightdashConfig } from '../config/parseConfig';
import Logger from '../logging/logger';
import { BaseService } from './BaseService';

interface LibreChatUser {
    name: string;
    username: string;
    email: string;
    emailVerified: boolean;
    provider: string;
    role: string;
    lightdashUuid: string;
    termsAccepted: boolean;
}

interface LibreChatConfig {
    url: string;
    enabled: boolean;
    apiKey?: string;
}

type LibreChatIntegrationServiceArguments = {
    lightdashConfig: LightdashConfig;
};

export class LibreChatIntegrationService extends BaseService {
    private lightdashConfig: LightdashConfig;
    private librechatConfig: LibreChatConfig;

    constructor({ lightdashConfig }: LibreChatIntegrationServiceArguments) {
        super();
        this.lightdashConfig = lightdashConfig;
        
        // Get LibreChat configuration from environment variables
        this.librechatConfig = {
            url: process.env.LIBRECHAT_URL || 'http://localhost:3080',
            enabled: process.env.LIBRECHAT_INTEGRATION_ENABLED === 'true',
            apiKey: process.env.LIBRECHAT_API_KEY
        };
    }

    /**
     * Sync a Lightdash user to LibreChat
     * This is called when a new user registers in Lightdash
     */
    async syncUserToLibreChat(lightdashUser: LightdashUser): Promise<void> {
        console.log("value of librechatConfig", this.librechatConfig);
        if (!this.librechatConfig.enabled) {
            Logger.debug('LibreChat integration is disabled');
            return;
        }

        try {
            const librechatUserData: LibreChatUser = {
                name: `${lightdashUser.firstName} ${lightdashUser.lastName}`.trim(),
                username: lightdashUser.email?.split('@')[0] || '',
                email: lightdashUser.email || '',
                emailVerified: true, // Assume verified if they're in Lightdash
                provider: 'lightdash',
                role: 'USER',
                lightdashUuid: lightdashUser.userUuid,
                termsAccepted: true // Assume accepted if they're using Lightdash
            };

            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            // Add API key if configured
            if (this.librechatConfig.apiKey) {
                headers['Authorization'] = `Bearer ${this.librechatConfig.apiKey}`;
            }

            const response = await axios.post(
                `${this.librechatConfig.url}/api/lightdash/sync-user-from-lightdash`,
                librechatUserData,
                {
                    headers,
                    timeout: 10000
                }
            );

            if (response.status === 200 || response.status === 201) {
                Logger.info(`Successfully synced user ${lightdashUser.userUuid} to LibreChat`);
            } else {
                Logger.warn(`Unexpected response from LibreChat: ${response.status}`);
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    Logger.warn('LibreChat is not available for user sync');
                } else if (error.response?.status === 409) {
                    Logger.debug(`User ${lightdashUser.userUuid} already exists in LibreChat`);
                } else {
                    Logger.error(`Failed to sync user to LibreChat: ${error.message}`);
                }
            } else {
                Logger.error('Unexpected error syncing user to LibreChat:', error);
            }
        }
    }

    /**
     * Check if LibreChat integration is enabled and available
     */
    async checkLibreChatConnection(): Promise<boolean> {
        if (!this.librechatConfig.enabled) {
            return false;
        }

        try {
            const response = await axios.get(
                `${this.librechatConfig.url}/api/lightdash/config`,
                { timeout: 5000 }
            );
            return response.status === 200;
        } catch (error) {
            Logger.warn('LibreChat is not available:', error);
            return false;
        }
    }

    /**
     * Get LibreChat configuration
     */
    getLibreChatConfig(): LibreChatConfig {
        return { ...this.librechatConfig };
    }
}
