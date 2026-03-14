import axios from "axios";

// ---------------- Base URL from Environment Variable ----------------
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8083/api";
export const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "http://localhost:8083";

// ---------------- Helper: create Axios instance with JWT interceptor ----------------
function createApi(path, options = {}) {
  const instance = axios.create({
    baseURL: `${BASE_URL}${path}`,
    headers: { "Content-Type": "application/json" },
    timeout: options.timeout || 10000,
  });

  // Automatically attach JWT token to every request
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Automatically handle 401 (token expired) — redirect to login
  instance.interceptors.response.use(
    (response) => response,
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
authApi.googleLogin = (token) => authApi.post("/google", { token });
authApi.requestOtp = (email) => authApi.post(`/request-otp?email=${email}`);
authApi.verifyOtp = (email, otp) => authApi.post("/verify-otp", { email, otp });
export const userApi = createApi("/users");
export const adminApi = createApi("/admin");
export const propertyApi = createApi("/properties", { timeout: 60000 }); // 60s for images
export const agentsApi = createApi("/agents");
export const favoritesApi = createApi("/favorites");
export const chatApi = createApi("/chat", { timeout: 30000 }); // 30s for chat attachments
export const analyticsApi = createApi("/analytics", { timeout: 15000 });
export const appointmentApi = createApi("/appointments");
export const slotsApi = createApi("/slots");
export const contactApi = createApi("/contact");

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
};
