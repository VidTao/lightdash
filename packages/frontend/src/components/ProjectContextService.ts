import { queuedLightdashApi } from '../api/queuedApi';

export class ProjectContextService {
    static async setCurrentProject(projectId: string): Promise<void> {
        try {
            await queuedLightdashApi({
                url: '/user/mcp-context/project',
                method: 'POST',
                body: JSON.stringify({ projectId }),
            });
        } catch (error) {
            console.warn('Failed to sync project context to backend:', error);
            // Don't throw - this is not critical for user experience
        }
    }
}