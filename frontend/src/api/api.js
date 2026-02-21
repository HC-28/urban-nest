import axios from "axios";

// ---------------- Base URL from Environment Variable ----------------
// In Vite, environment variables starting with VITE_ are accessible via import.meta.env
export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8083/api";
export const IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "http://localhost:8083";

// ---------------- Property API ----------------
export const propertyApi = axios.create({
  baseURL: `${BASE_URL}/properties`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ---------------- User API ----------------
export const userApi = axios.create({
  baseURL: `${BASE_URL}/users`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ---------------- Agents API ----------------
export const agentsApi = axios.create({
  baseURL: `${BASE_URL}/agents`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ---------------- Favorites API ----------------
export const favoritesApi = axios.create({
  baseURL: `${BASE_URL}/favorites`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ---------------- Chat API ----------------
export const chatApi = axios.create({
  baseURL: `${BASE_URL}/chat`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ---------------- Analytics API ----------------
export const analyticsApi = axios.create({
  baseURL: `${BASE_URL}/analytics`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ---------------- Appointment API ----------------
export const appointmentApi = axios.create({
  baseURL: `${BASE_URL}/appointments`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ---------------- Slots API (Agent Availability) ----------------
export const slotsApi = axios.create({
  baseURL: `${BASE_URL}/slots`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// ---------------- Auth API (Alias for User API for now) ----------------
export const authApi = userApi;

// ---------------- Default Export (Optional) ----------------
export default {
  propertyApi,
  userApi,
  authApi,
  agentsApi,
  favoritesApi,
  chatApi,
  analyticsApi,
  appointmentApi
};
