export class ProjectContext {
    private static PROJECT_KEY = 'lightdash_current_project_id';
    
    static setCurrentProject(projectId: string): void {
        sessionStorage.setItem(this.PROJECT_KEY, projectId);
        
        // Also dispatch an event so other parts of the app can listen
        window.dispatchEvent(new CustomEvent('projectChanged', { 
            detail: { projectId } 
        }));
    }
    
    static getCurrentProject(): string | null {
        return sessionStorage.getItem(this.PROJECT_KEY);
    }
    
    static clearCurrentProject(): void {
        sessionStorage.removeItem(this.PROJECT_KEY);
        window.dispatchEvent(new CustomEvent('projectChanged', { 
            detail: { projectId: null } 
        }));
    }
}