import axios from "axios";

// ---------------- Base URL from Environment Variable ----------------
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8083/api";
export const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "http://localhost:8083";

// ---------------- Helper: create Axios instance with JWT interceptor ----------------
function createApi(path, options = {}) {
  const instance = axios.create({
    baseURL: `${BASE_URL}${path}`,
    headers: { "Content-Type": "application/json" },
    timeout: options.timeout || 60000,
    withCredentials: true,
  });

  // Automatically attach JWT token to every request and sanitize params
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Sanitize query parameters: remove "All", empty strings, and nulls
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

  // Automatically handle 401 (token expired) and unwrap new ApiResponse formats
  instance.interceptors.response.use(
    (response) => {
      // Unwrap standard ApiResponse<T> if the backend provides it
      if (response.data && typeof response.data === "object" && "success" in response.data && "data" in response.data) {
        response.data = response.data.data;
      }
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid — clear everything and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (window.location.pathname !== "/login" && window.location.pathname !== "/signup") {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// ---------------- API Instances ----------------
export const authApi = createApi("/auth");
authApi.googleLogin = (data) => authApi.post("/google", data);
authApi.checkUser = (email) => authApi.post("/check-user", { email });
authApi.requestOtp = (email) => authApi.post(`/request-otp?email=${email}`);
authApi.verifyOtp = (email, otp) => authApi.post("/verify-otp", { email, otp });
authApi.registerOtp = (email) => authApi.post(`/register-otp?email=${email}`);
authApi.resetPasswordOtp = (email) => authApi.post(`/reset-password-otp?email=${email}`);
authApi.resetPasswordVerify = (email, otp, newPassword) => authApi.post("/reset-password-verify", { email, otp, newPassword });
export const userApi = createApi("/users");
export const adminApi = createApi("/admin");
export const propertyApi = createApi("/properties", { timeout: 60000 }); // 60s for images
propertyApi.getFeatured = () => propertyApi.get("/featured");
propertyApi.getTrending = () => propertyApi.get("/trending");
propertyApi.toggleFeature = (id, agentId) => propertyApi.put(`/${id}/feature?agentId=${agentId}`);
export const agentsApi = createApi("/agents");
export const favoritesApi = createApi("/favorites");
export const chatApi = createApi("/chat", { timeout: 30000 }); // 30s for chat attachments
export const analyticsApi = createApi("/analytics", { timeout: 15000 });
export const appointmentApi = createApi("/appointments");
export const slotsApi = createApi("/slots");
export const contactApi = createApi("/contact");
export const reviewsApi = createApi("/reviews");
export const agencyApi = createApi("/agencies");

// ---------------- Default Export ----------------
export default {
  authApi,
  userApi,
  adminApi,
  propertyApi,
  agentsApi,
  favoritesApi,
  chatApi,
  analyticsApi,
  appointmentApi,
  slotsApi,
  contactApi,
  reviewsApi,
  agencyApi,
};
