import axios from "axios";

export const BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "";

/**
 * Creates a configured Axios client instance with standard enterprise interceptors:
 * 1. Automatic JWT Bearer token injection
 * 2. Query param sanitization (strips "All", empty strings, null, undefined)
 * 3. Standard response envelope unwrapping (ApiResponse<T>)
 * 4. Automatic 401 token expiration handling and redirect
 */
export function createApiClient(endpointPrefix = "", options = {}) {
    const instance = axios.create({
        baseURL: `${BASE_URL}${endpointPrefix}`,
        headers: { "Content-Type": "application/json" },
        timeout: options.timeout || 60000,
        withCredentials: true,
        ...options
    });

    // Request Interceptor: Auth Token & Param Sanitization
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.params) {
            const cleanParams = { ...config.params };
            Object.keys(cleanParams).forEach((key) => {
                const value = cleanParams[key];
                if (value === "All" || value === "" || value === null || value === undefined) {
                    delete cleanParams[key];
                }
            });
            config.params = cleanParams;
        }

        return config;
    });

    // Response Interceptor: Envelope Unwrapping & 401 Session Handling
    instance.interceptors.response.use(
        (response) => {
            if (
                response.data &&
                typeof response.data === "object" &&
                "success" in response.data &&
                "data" in response.data
            ) {
                response.data = response.data.data;
            }
            return response;
        },
        (error) => {
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                if (
                    window.location.pathname !== "/login" &&
                    window.location.pathname !== "/signup"
                ) {
                    window.location.href = "/login";
                }
            }
            return Promise.reject(error);
        }
    );

    return instance;
}

export default createApiClient;
