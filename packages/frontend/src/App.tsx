import { ModalsProvider } from '@mantine/modals';
import { wrapCreateBrowserRouterV7 } from '@sentry/react';
import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import { DocumentTitle } from './components/common/DocumentTitle';
import VersionAutoUpdater from './components/VersionAutoUpdater/VersionAutoUpdater';
import {
    CommercialMobileRoutes,
    CommercialWebAppRoutes,
} from './ee/CommercialRoutes';
import ErrorBoundary from './features/errorBoundary/ErrorBoundary';
import { SourceCodeEditorProvider } from './features/sourceCodeEditor';
import ChartColorMappingContextProvider from './hooks/useChartColorConfig/ChartColorMappingContextProvider';
import MobileRoutes from './MobileRoutes';
import AbilityProvider from './providers/Ability/AbilityProvider';
import ActiveJobProvider from './providers/ActiveJob/ActiveJobProvider';
import AppProvider from './providers/App/AppProvider';
import FullscreenProvider from './providers/Fullscreen/FullscreenProvider';
import Mantine8Provider from './providers/Mantine8Provider';
import MantineProvider from './providers/MantineProvider';
import ReactQueryProvider from './providers/ReactQuery/ReactQueryProvider';
import SchedulerJobsProvider from './providers/SchedulerJobs/SchedulerJobsProvider';
import ThirdPartyProvider from './providers/ThirdPartyServicesProvider';
import TrackingProvider from './providers/Tracking/TrackingProvider';
import Routes from './Routes';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';
import environment from './bratrax-implementation/environments';

// const isMobile =
//     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
//         navigator.userAgent,
//     ) || window.innerWidth < 768;

const isMobile = window.innerWidth < 768;
const googleClientId =
    '452833261444-1amauhc3bsundipofc2qvf3sonikknpa.apps.googleusercontent.com'; //this needs to go to env file
const isMinimalPage = window.location.pathname.startsWith('/minimal');

// Sentry wrapper for createBrowserRouter
const sentryCreateBrowserRouter =
    wrapCreateBrowserRouterV7(createBrowserRouter);

const initFacebookSDK = () => {
    if (!(window as any).FB) return;
    // @ts-ignore
    window.FB.init({
        appId: environment.fbAppId,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
    });
};

const router = sentryCreateBrowserRouter([
    {
        path: '/',
        element: (
            <AppProvider>
                <FullscreenProvider enabled={isMobile || !isMinimalPage}>
                    <VersionAutoUpdater />
                    <ThirdPartyProvider enabled={isMobile || !isMinimalPage}>
                        <ErrorBoundary wrapper={{ mt: '4xl' }}>
                            <TrackingProvider
                                enabled={isMobile || !isMinimalPage}
                            >
                                <AbilityProvider>
                                    <ActiveJobProvider>
                                        <SchedulerJobsProvider>
                                        <GoogleOAuthProvider
                                            clientId={googleClientId}
                                        >
                                            <ChartColorMappingContextProvider>
                                                <SourceCodeEditorProvider>
                                                    <Outlet />
                                                </SourceCodeEditorProvider>
                                            </ChartColorMappingContextProvider>
                                            </GoogleOAuthProvider>
                                        </SchedulerJobsProvider>
                                    </ActiveJobProvider>
                                </AbilityProvider>
                            </TrackingProvider>
                        </ErrorBoundary>
                    </ThirdPartyProvider>
                </FullscreenProvider>
            </AppProvider>
        ),
        children: isMobile
            ? [...MobileRoutes, ...CommercialMobileRoutes]
            : [...Routes, ...CommercialWebAppRoutes],
    },
]);
const App = () => {
    useEffect(() => {
        initFacebookSDK();
    }, []);
    return (
        <>
            <title>Bratrax</title>

        <ReactQueryProvider>
            <MantineProvider withGlobalStyles withNormalizeCSS withCSSVariables>
                <Mantine8Provider>
                    <ModalsProvider>
                        <RouterProvider router={router} />
                    </ModalsProvider>
                </Mantine8Provider>
            </MantineProvider>
        </ReactQueryProvider>
        </>
    );
};

export default App;
