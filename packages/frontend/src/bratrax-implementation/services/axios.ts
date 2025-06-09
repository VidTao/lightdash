import axios from "axios";

const axiosInstance = axios.create({
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

// Keep track of the interceptor ID
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
        config.httpsAgent.options = { ...config.httpsAgent.options, rejectUnauthorized: false };
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Add response interceptor for better error logging
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Axios Error:', {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response
    });
    return Promise.reject(error);
  }
);

export default axiosInstance;