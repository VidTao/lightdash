import 'express-session';

declare module 'express-session' {
    interface SessionData {
        currentProjectId?: string;
        oauth: {
            inviteCode?: string | undefined;
            returnTo?: string | undefined;
            codeVerifier?: string | undefined;
            state?: string | undefined;
            isPopup?: boolean | undefined;
        };
    }
}
