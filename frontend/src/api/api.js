import axios from "axios";

// ---------------- Base URL from Environment Variable ----------------
// In Vite, environment variables starting with VITE_ are accessible via import.meta.env
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8083/api";

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

// ---------------- Default Export (Optional) ----------------
export default {
  propertyApi,
  userApi,
  agentsApi,
  favoritesApi
};
