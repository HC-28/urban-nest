import { createApiClient, BASE_URL, IMAGE_URL } from "./apiClient";

export { BASE_URL, IMAGE_URL };

// ─── Authentication API ──────────────────────────────────────────
export const authApi = createApiClient("/auth");
authApi.googleLogin = (data) => authApi.post("/google", data);
authApi.checkUser = (email) => authApi.post("/check-user", { email });
authApi.requestOtp = (email) => authApi.post(`/request-otp?email=${encodeURIComponent(email)}`);
authApi.verifyOtp = (email, otp) => authApi.post("/verify-otp", { email, otp });
authApi.registerOtp = (email) => authApi.post(`/register-otp?email=${encodeURIComponent(email)}`);
authApi.resetPasswordOtp = (email) => authApi.post(`/reset-password-otp?email=${encodeURIComponent(email)}`);
authApi.resetPasswordVerify = (email, otp, newPassword) =>
    authApi.post("/reset-password-verify", { email, otp, newPassword });

// ─── Users & Admin API ───────────────────────────────────────────
export const userApi = createApiClient("/users");
export const adminApi = createApiClient("/admin");

// ─── Properties API ──────────────────────────────────────────────
export const propertyApi = createApiClient("/properties", { timeout: 60000 });
propertyApi.getFeatured = () => propertyApi.get("/featured");
propertyApi.getTrending = () => propertyApi.get("/trending");
propertyApi.toggleFeature = (id) => propertyApi.put(`/${id}/feature`);
propertyApi.getMyProperties = () => propertyApi.get("/agent/me");
propertyApi.relist = (id) => propertyApi.put(`/${id}/relist`);
propertyApi.markSold = (id) => propertyApi.put(`/${id}/sold`);
propertyApi.hardDelete = (id) => propertyApi.delete(`/${id}/permanent`);

// ─── Agents & Favorites API ──────────────────────────────────────
export const agentsApi = createApiClient("/agents");
export const favoritesApi = createApiClient("/favorites");
favoritesApi.getMyFavorites = () => favoritesApi.get("/me");
favoritesApi.checkStatus = (propertyId) => favoritesApi.get(`/status?propertyId=${propertyId}`);

// ─── Chat & Analytics API ────────────────────────────────────────
export const chatApi = createApiClient("/chat", { timeout: 30000 });
chatApi.getMyChatsAsAgent = () => chatApi.get("/agent/me");
chatApi.getMyChatsAsBuyer = () => chatApi.get("/buyer/me");

export const analyticsApi = createApiClient("/analytics", { timeout: 15000 });

// ─── Appointments & Slots API ────────────────────────────────────
export const appointmentApi = createApiClient("/appointments");
appointmentApi.getAgentAppointments = () => appointmentApi.get("/agent/me");
appointmentApi.getBuyerAppointments = () => appointmentApi.get("/buyer/me");

export const slotsApi = createApiClient("/slots");
slotsApi.getMySlots = () => slotsApi.get("/agent/me");

// ─── Contact & Reviews API ───────────────────────────────────────
export const contactApi = createApiClient("/contact");
export const reviewsApi = createApiClient("/reviews");

// ─── Agencies API ────────────────────────────────────────────────
export const agencyApi = createApiClient("/agencies");
agencyApi.getMe = () => agencyApi.get("/me");
agencyApi.getPendingAgents = () => agencyApi.get("/pending-agents");
agencyApi.register = (data) => agencyApi.post("/register", data);
agencyApi.approveAgent = (id) => agencyApi.post(`/approve-agent/${id}`);
agencyApi.rejectAgent = (id) => agencyApi.post(`/reject-agent/${id}`);

// ─── Dedicated File Upload API ───────────────────────────────────
export const uploadApi = createApiClient("/upload");
uploadApi.uploadFile = (formData, type = "misc") => {
    formData.append("type", type);
    return uploadApi.post("", formData, { headers: { "Content-Type": "multipart/form-data" } });
};

// ─── Default Unified Export ──────────────────────────────────────
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
    uploadApi
};
