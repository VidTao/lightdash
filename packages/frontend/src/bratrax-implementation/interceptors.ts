import axiosInstance from './services/axios';

let requestInterceptorId: number | null = null;
export const setupAxiosInterceptor = (userId: string | undefined) => {
    // Remove existing interceptor if it exists
    if (requestInterceptorId !== null) {
        axiosInstance.interceptors.request.eject(requestInterceptorId);
    }

    // Add new interceptor and store its ID
    requestInterceptorId = axiosInstance.interceptors.request.use(
        (config) => {
            if (userId) {
                config.headers['user-id'] = userId;
            }
            // Disable SSL verification for development
            if (config.httpsAgent) {
                config.httpsAgent.options = {
                    ...config.httpsAgent.options,
                    rejectUnauthorized: false,
                };
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        },
    );
};
